# Kita Kita - Project TODO

## Phase 1: Project Setup & Infrastructure
- [x] Generate app logo and update app.config.ts with branding
- [x] Set up database schema (users, groups, group_members, locations, battery_status)
- [x] Create tRPC API routes for authentication, groups, locations
- [x] Set up Manus OAuth integration (already built-in)
- [x] Create database migration scripts
- [x] Write and pass unit tests for all API endpoints

## Phase 2: Core UI Screens
- [x] Build Splash/Loading screen
- [x] Build Login screen with OAuth button
- [x] Build Home/Map screen with map display
- [x] Build Group Management screen (list groups, create/join)
- [x] Build Group Details screen
- [x] Build Settings screen
- [x] Build User Profile screen
- [x] Implement tab bar navigation

## Phase 3: Location & Background Services
- [x] Integrate expo-location for foreground location tracking
- [ ] Set up expo-task-manager for background location updates
- [x] Implement background fetch task for periodic location sync
- [x] Create location update service (send to server)
- [x] Handle location permissions (request + check)
- [x] Implement location polling (configurable intervals: 5s, 10s, 30s, 1min)

## Phase 4: Battery Monitoring
- [ ] Integrate expo-battery for battery status
- [ ] Create battery status polling service
- [ ] Send battery level with each location update
- [ ] Display battery percentage on map markers
- [ ] Implement battery color coding (green/yellow/red)
- [ ] Add battery indicator in UI (top-right corner)

## Phase 5: Real-Time Map Display
- [ ] Integrate expo-maps for native map rendering
- [ ] Display user's own location on map
- [ ] Display group members' locations as markers
- [ ] Implement marker clustering for many users
- [ ] Add marker tap interaction (show member details)
- [ ] Implement map auto-center on user location
- [ ] Add location accuracy indicator (circle around marker)
- [ ] Implement manual refresh (pull-to-refresh)

## Phase 6: Group Management
- [ ] Implement create group functionality
- [ ] Generate unique group codes (shareable)
- [ ] Implement join group by code
- [ ] Implement leave group
- [ ] Implement delete group (owner only)
- [ ] Implement member list view
- [ ] Implement remove member (owner only)
- [ ] Implement share group code (copy + messaging)

## Phase 7: Backend API Implementation
- [ ] Create tRPC router for groups (create, list, join, leave, delete)
- [ ] Create tRPC router for locations (update, get group locations)
- [ ] Create tRPC router for battery status (update, get)
- [ ] Create tRPC router for users (get profile, update profile)
- [ ] Implement location history storage (optional)
- [ ] Add input validation with Zod schemas
- [ ] Add error handling and logging

## Phase 8: State Management & Data Sync
- [ ] Set up React Context for app state
- [ ] Implement location update polling logic
- [ ] Implement battery status polling logic
- [ ] Set up AsyncStorage for offline caching
- [ ] Implement optimistic updates for UI responsiveness
- [ ] Handle network errors and retries
- [ ] Implement data sync when app comes online

## Phase 9: Background Tracking (iOS & Android)
- [ ] Configure background task permissions in app.config.ts
- [ ] Test background location tracking on iOS
- [ ] Test background location tracking on Android
- [ ] Implement battery saver mode (longer intervals)
- [ ] Handle edge cases (app killed, device sleep)
- [ ] Implement location queue for offline updates

## Phase 10: Settings & User Preferences
- [ ] Implement location update frequency settings
- [ ] Implement background tracking toggle
- [ ] Implement battery saver mode toggle
- [ ] Implement notification preferences
- [ ] Implement privacy settings
- [ ] Implement logout functionality
- [ ] Persist settings to AsyncStorage

## Phase 11: Notifications & Alerts
- [ ] Set up expo-notifications
- [ ] Implement low battery warning notification
- [ ] Implement member joined group notification
- [ ] Implement member left group notification
- [ ] Implement location update failure notification (optional)

## Phase 12: Testing & Polish
- [ ] Test location tracking accuracy
- [ ] Test background task reliability
- [ ] Test battery status updates
- [ ] Test group creation and joining
- [ ] Test map marker updates
- [ ] Test offline functionality
- [ ] Test battery drain in different modes
- [ ] Test UI responsiveness on different screen sizes
- [ ] Fix bugs and edge cases
- [ ] Optimize performance (reduce re-renders, optimize queries)

## Phase 13: Documentation & Delivery
- [ ] Write in-app help/tutorial
- [ ] Create user documentation
- [ ] Generate app logo and finalize branding
- [ ] Create initial checkpoint
- [ ] Prepare for publishing
