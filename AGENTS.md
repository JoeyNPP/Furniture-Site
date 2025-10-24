# AGENTS Directory

This file centralizes information about human and automated agents supporting the NPP Deals platform. Update it whenever roles change or new automations are introduced.

---

## Agent Roster
| Agent Name | Role | Contact | Responsibilities | Systems Access | Coverage Window |
|------------|------|---------|------------------|----------------|-----------------|
| Joey Smith | Inventory Manager | joey.smith@company.com | Catalog maintenance, CSV imports | Frontend, Backend Admin, S3 | 9 AM-5 PM EST |
| Alex Johnson | Admin | alex.johnson@company.com | User management, configuration | Backend Admin, SSH, Database | 24x7 |
| PriceSyncBot | Automation | webhook@pagerduty.com | Nightly price updates | API Token, Database | 00:00-02:00 UTC |

---

## Onboarding Checklist
- [x] Accounts created (frontend, backend admin, SSH, database).
- [x] Environment variables shared securely.
- [x] MFA / SSH keys configured and tested.
- [ ] Added to incident communication channels.
- [ ] Runbook walkthrough completed.

---

## Access Requirements
- **Inventory Management**: Frontend admin rights, API token for bulk uploads.
- **Database Maintenance**: SSH access plus PostgreSQL superuser credentials.
- **Broadcast Operations**: ESP credentials and template repository access.

---

## Runbooks & Playbooks
- Inventory import: scripts/import_csv.py
- Broadcast approval: docs/broadcast_approval.md
- Incident response: docs/incident_response.md

---

## Escalation & Contacts
| Situation | Primary | Secondary | Notes |
|-----------|---------|-----------|-------|
| API downtime | Joey Smith | Alex Johnson | PagerDuty escalation chain |
| Database issues | Alex Johnson | PriceSyncBot On-Call | Refer to backup restoration SOP |
| Security incident | Alex Johnson | Security Team | See incident response playbook |

---

## Change Log
- 2025-10-23 – Initial roster populated for production launch readiness.

---

Last updated: 2025-10-23
