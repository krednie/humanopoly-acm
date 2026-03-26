# Human Monopoly Dashboard – Action Plan

## Phase 1: Define System Structure
- Define core entities:
  6 teams max
  - Players
  - Properties
  - Ownership
  - Transactions
- Define unique IDs for all entities (teamId, propertyId)

---

## Phase 2: Define API Contract
Create fixed function interfaces:

- getGameState()
- buyProperty(propertyId, teamId)
- payRent(propertyId, teamId)
- completeTask(propertyId, teamId, amount)

These must remain unchanged regardless of backend.
because we haven't decided if we want to use google sheets or a backend. so frontend should be able to use either. 

---

## Phase 3: Build Mock Backend (Local State)
- Create in-memory gameState object
- Implement logic for:
  - Buying property
  - Paying rent
  - Completing tasks
- No database or sheets at this stage

---

## Phase 4: Build Player UI

### Screen States:
1. Default View
   - Show balance
   - Show owned properties
could use bento grid

	admin dashboard
2. Unowned Property
   - Show property details
   - Show task progress
   - Buttons:
     - Complete Task
     - Buy Property
     - Skip
when you land on a property, which u will in real life, you will get the name of that property pushed by admin side, and the task generated will be pushed at random. the task list will have a count of how many times each task has been pushed for each task. and we will prioritize based on which task is used less. 

3. Owned Property
   - Show owner
   - Show rent
   - Button:
     - Pay Rent

---

## Phase 5: Build Admin Dashboard
- Approve task completion
- Trigger rewards
- Assign pending owner
- Monitor leaderboard
- Edit balances manually

---

## Phase 6: Shared Components
- Leaderboard (sorted by net worth)
- Transaction log
- Property list

---

## Phase 7: Add State Management
- Ensure UI reacts to state changes
- Centralize state updates
- Maintain consistency between components

---

## Phase 8: Add Validation Rules
- Prevent buying owned property
- Prevent insufficient balance transactions
- Prevent self-rent payments

---

## Phase 9: Backend Integration Decision

### Option A: Google Sheets
- Replace API functions with Apps Script endpoints

### Option B: Supabase
- Replace API functions with database queries

---

## Phase 10: Replace Mock Backend
- Swap local state with real backend
- Keep UI unchanged

---

## Phase 11: Testing
- Simulate multiple players
- Test edge cases:
  - simultaneous actions
  - insufficient balance
  - repeated clicks

---

## Phase 12: Deployment
- Host frontend
- Connect backend
- Ensure real-time updates (if needed)
player dashboard (mobile)
1. header (top bar)
team name
current balance
net worth (optional = balance + property value)
2. current turn / position panel

shown only when player lands on a tile

fields:
property name
property status:
vacant
owned by [team]
3. conditional action panel
case A: unowned property
display:
property price
total task value (= price)
task progress:
completed value / total value
buttons:
complete task (admin usually triggers, but can reflect here)
buy property
skip
case B: owned by another team
display:
owner name
rent amount
button:
pay rent

(no auto deduction)

case C: owned by self
display:
“you own this property”
rent value (for reference only)

(no actions)

4. properties owned section

list format:

property name
rent value

(optional)

color group
5. transaction history

list:

time
type:
reward
purchase
rent
amount (+ / -)
property reference
6. leaderboard (compact)
rank
team name
net worth

(read-only)

admin dashboard (desktop)
1. global game panel
all teams with:
balance
total property value
net worth

(sorted leaderboard)

2. property control table

each row = one property

columns:
property name
price
rent
owner
status:
vacant
locked
owned
control fields per row:
task section
input: task value
input: team name
button: give reward
purchase section
input: pending owner
button: buy
rent section
input: renter
button: pay rent
3. live activity log

table:

timestamp
team
action:
reward
buy
rent
amount
property
4. override controls
edit team balance manually
assign/remove property owner
clear property lock
5. conflict handling
show:
multiple teams on same tile
active property locks

admin decides:

which team proceeds

the panels will be same on mobile and desktop, just the layout will change.