# AGENTS Directory

This file centralizes information about human and automated agents supporting the NPP Deals platform. Update it whenever roles change or new automations are introduced.

---

## How to Use This Document
- Record every operator who can act on the platform (inventory, broadcasts, ops).
- Track required tools, credentials, and escalation paths.
- Append playbooks or runbooks that reference these agents.

---

## Agent Roster
| Agent Name | Role | Contact | Primary Responsibilities | Systems Access | Coverage Window |
|------------|------|---------|--------------------------|----------------|-----------------|
| [Full Name] | [e.g., Inventory Manager] | [email / Slack] | [Daily catalog maintenance, CSV imports] | [frontend, backend admin, S3] | [Business hours / 24x7] |
| [Full Name] | [e.g., Broadcast Operator] | [email / Slack] | [Email campaign authoring, segmentation] | [frontend, ESP] | [Timezone + hours] |
| [Automation ID] | [e.g., Price Sync Bot] | [PagerDuty / webhook] | [Nightly price updates] | [API token, database] | [Schedule] |

Add or remove rows as needed.

---

## Onboarding Checklist
- [ ] Accounts created (frontend, backend admin, SSH, database).
- [ ] Environment variables shared securely.
- [ ] MFA / SSH keys configured and tested.
- [ ] Added to incident communication channels.
- [ ] Runbook walkthrough completed.

---

## Access Requirements
- **Inventory Management**: Requires frontend admin rights and API token for bulk uploads.
- **Database Maintenance**: Requires SSH access plus PostgreSQL superuser credentials.
- **Broadcast Operations**: Needs ESP credentials and template repository access.

Document any additional requirements per role.

---

## Runbooks & Playbooks
Reference or link detailed procedures:
- Inventory import: `[Link or path]`
- Broadcast approval: `[Link or path]`
- Incident response: `[Link or path]`

---

## Escalation & Contacts
| Situation | Primary | Secondary | Notes |
|-----------|---------|-----------|-------|
| API downtime | [Name] | [Name] | Provide PagerDuty ID / phone tree |
| Database issues | [Name] | [Name] | Include backup restore instructions |
| Security incident | [Name] | [Name] | Link to incident response runbook |

---

## Change Log
Document notable updates to agent responsibilities here:
- `YYYY-MM-DD` – `[Summary of change]`

---

Last updated: `YYYY-MM-DD`