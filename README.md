# Maharati — Peer-to-Peer Skill Exchange Platform

A full-stack web application that allows users to teach and learn through a structured credit-based exchange model.

## Tech Stack
- **Frontend:** React.js, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT, bcrypt
- **Features:** Role-based access (User / Admin / Super Admin), session booking, dispute handling, email verification, password reset, profile image upload, notifications

## Key Features
- Users can list skills they offer and skills they want to learn
- Credit-based session booking with escrow-style logic
- Dispute resolution managed by Admin
- Super Admin governance layer
- Email verification and password reset flows
- Reliability scoring and rating system

## Roles
| Role | Capabilities |
|------|-------------|
| User | Browse teachers, book sessions, confirm, dispute, rate |
| Admin | Resolve disputes, monitor users, suspend accounts |
| Super Admin | Manage admins, full platform governance |

## Status
In active development — senior capstone project at Lebanese International University
