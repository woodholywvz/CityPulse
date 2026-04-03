from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models import Issue, SupportTicket, TicketMessage, User
from app.schemas.admin import (
    AdminTicketDetailRead,
    AdminTicketListItemRead,
    AdminTicketMessageRead,
    AdminTicketReplyCreate,
    AdminTicketStatusUpdate,
)
from app.services.admin_audit import AdminAuditService
from app.services.trust_scores import serialize_admin_identity


class AdminTicketService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.audit = AdminAuditService(session)

    async def list_tickets(
        self,
        *,
        limit: int = 50,
        status: str | None = None,
        ticket_type: str | None = None,
    ) -> list[AdminTicketListItemRead]:
        statement = (
            select(SupportTicket)
            .options(
                selectinload(SupportTicket.author),
                selectinload(SupportTicket.issue),
                selectinload(SupportTicket.messages).selectinload(TicketMessage.author),
            )
            .order_by(SupportTicket.updated_at.desc())
            .limit(limit)
        )
        if status is not None:
            statement = statement.where(SupportTicket.status == status)
        if ticket_type is not None:
            statement = statement.where(SupportTicket.ticket_type == ticket_type)

        tickets = list((await self.session.scalars(statement)).all())
        return [serialize_admin_ticket_list_item(ticket) for ticket in tickets]

    async def get_ticket_detail(self, ticket_id: UUID) -> AdminTicketDetailRead:
        ticket = await self._load_ticket(ticket_id)
        return serialize_admin_ticket_detail(ticket)

    async def reply_to_ticket(
        self,
        *,
        ticket_id: UUID,
        admin: User,
        payload: AdminTicketReplyCreate,
    ) -> AdminTicketDetailRead:
        ticket = await self._load_ticket(ticket_id)
        message = TicketMessage(
            ticket_id=ticket.id,
            author_id=admin.id,
            body=payload.body.strip(),
            is_internal=payload.is_internal,
        )
        ticket.messages.append(message)
        if payload.status is not None:
            ticket.status = payload.status

        self.audit.record(
            admin=admin,
            action="ticket.reply",
            entity_type="ticket",
            entity_id=ticket.id,
            note=None,
            payload={
                "is_internal": payload.is_internal,
                "status": payload.status.value if payload.status is not None else None,
            },
        )
        await self.session.commit()
        return await self.get_ticket_detail(ticket.id)

    async def update_ticket_status(
        self,
        *,
        ticket_id: UUID,
        admin: User,
        payload: AdminTicketStatusUpdate,
    ) -> AdminTicketDetailRead:
        ticket = await self._load_ticket(ticket_id)
        previous_status = ticket.status
        ticket.status = payload.status
        self.audit.record(
            admin=admin,
            action="ticket.status_update",
            entity_type="ticket",
            entity_id=ticket.id,
            note=payload.note,
            payload={
                "previous_status": previous_status.value,
                "next_status": payload.status.value,
            },
        )
        await self.session.commit()
        return await self.get_ticket_detail(ticket.id)

    async def _load_ticket(self, ticket_id: UUID) -> SupportTicket:
        ticket = await self.session.scalar(
            select(SupportTicket)
            .where(SupportTicket.id == ticket_id)
            .options(
                selectinload(SupportTicket.author),
                selectinload(SupportTicket.issue).selectinload(Issue.moderation_results),
                selectinload(SupportTicket.messages).selectinload(TicketMessage.author),
            )
        )
        if ticket is None:
            raise NotFoundError("Support ticket was not found.")
        return ticket


def serialize_admin_ticket_message(message: TicketMessage) -> AdminTicketMessageRead:
    return AdminTicketMessageRead(
        id=message.id,
        ticket_id=message.ticket_id,
        author_id=message.author_id,
        author_name=message.author.full_name,
        author_role=message.author.role.value,
        body=message.body,
        is_internal=message.is_internal,
        created_at=message.created_at,
        updated_at=message.updated_at,
    )


def serialize_admin_ticket_list_item(ticket: SupportTicket) -> AdminTicketListItemRead:
    latest_message = ticket.messages[-1] if ticket.messages else None
    return AdminTicketListItemRead(
        id=ticket.id,
        issue_id=ticket.issue_id,
        author=serialize_admin_identity(ticket.author),
        ticket_type=ticket.ticket_type,
        status=ticket.status,
        subject=ticket.subject,
        message_count=len(ticket.messages),
        latest_message_preview=latest_message.body[:180] if latest_message else None,
        latest_message_at=latest_message.created_at if latest_message else None,
        issue_title=ticket.issue.title if ticket.issue is not None else None,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


def serialize_admin_ticket_detail(ticket: SupportTicket) -> AdminTicketDetailRead:
    latest_moderation = ticket.issue.latest_moderation_result if ticket.issue is not None else None
    return AdminTicketDetailRead(
        id=ticket.id,
        issue_id=ticket.issue_id,
        author=serialize_admin_identity(ticket.author),
        ticket_type=ticket.ticket_type,
        status=ticket.status,
        subject=ticket.subject,
        issue_title=ticket.issue.title if ticket.issue is not None else None,
        issue_status=ticket.issue.status if ticket.issue is not None else None,
        latest_moderation_code=latest_moderation.decision_code if latest_moderation else None,
        messages=[serialize_admin_ticket_message(message) for message in ticket.messages],
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )
