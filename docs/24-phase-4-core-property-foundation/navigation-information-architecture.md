# Navigation & Information Architecture

## Status

**Accepted and implemented**

## Goal

Define a coherent, enterprise-grade information architecture for Phase 4 that
supports immediate property operations and future module growth.

## Core Navigation Structure (Property Manager)

### Primary Navigation

1. Dashboard
2. Properties
3. Units
4. Activity
5. Tasks
6. Reports (foundation entry; detailed reporting future)

### Global Utilities

- Organization switcher
- Role switcher (when applicable)
- Search/command access
- Notifications
- Profile/account

## Route Surface (Implemented)

- `/dashboard`
- `/properties`
- `/properties/new`
- `/properties/[propertyId]`
- `/properties/[propertyId]/edit`
- `/units`
- `/units/new`
- `/units/[unitId]`
- `/units/[unitId]/edit`

## Information Hierarchy

### Dashboard

- Portfolio health first
- Immediate priorities second
- Historical/recent feed third

### Properties

- Property list with filters/sort/search
- Property detail with sections:
  - Overview
  - Location
  - Ownership
  - Units summary
  - Recent activity

### Units

- Unit list with occupancy/availability filters
- Unit detail with sections:
  - Unit facts
  - Commercial attributes
  - Occupancy status
  - Future-linked modules (leases, maintenance, accounting)

## IA Rules

1. No dead-end pages.
2. Every detail view links back to its parent list and organization context.
3. Breadcrumbs required for deep navigation.
4. Cross-linking between property and unit must preserve context.
5. Unauthorized routes resolve to explicit unauthorized surface.

## Accessibility and Interaction

- Full keyboard reachability in nav structures.
- Focus management on route transitions and modal/form flows.
- Mobile and desktop parity for critical navigation paths.

## Future-Proofing

IA leaves stable expansion slots for:

- Leasing
- Maintenance
- Financial operations
- Documents
- Communications
