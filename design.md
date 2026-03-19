# Kita Kita - Real-Time Location Sharing App Design

## Overview

**Kita Kita** (meaning "I see you" in Filipino) is a real-time location sharing app that allows users to share their live GPS location with partners or groups. The app displays all members on a map with their battery percentage and continuously updates their positions even when the app is in the background.

---

## Screen List

1. **Splash/Loading Screen** - Initial app load with logo
2. **Login Screen** - OAuth authentication
3. **Home/Map Screen** - Main map view showing all group members' locations
4. **Group Management Screen** - Create/join groups, manage members
5. **Settings Screen** - App preferences, location permissions, battery settings
6. **User Profile Screen** - View/edit user information
7. **Group Details Screen** - View group members, their battery status, leave group

---

## Primary Content and Functionality

### 1. Splash/Loading Screen
- **Content**: App logo (Kita Kita), loading indicator
- **Functionality**: Check user authentication status, initialize app
- **Auto-navigate**: To Home (if authenticated) or Login (if not)

### 2. Login Screen
- **Content**: 
  - App logo
  - "Sign in with Manus" button
  - Privacy notice about location sharing
- **Functionality**: 
  - OAuth login via Manus
  - Request location permissions
  - Request background location access
  - Save user session

### 3. Home/Map Screen (PRIMARY SCREEN)
- **Content**:
  - Full-screen map (using `expo-maps`)
  - Map markers for each group member showing:
    - User avatar/icon
    - User name
    - Battery percentage (color-coded: green >50%, yellow 20-50%, red <20%)
    - Last update timestamp
  - Current user's own marker (highlighted differently)
  - Tab bar with: Map, Groups, Profile
- **Functionality**:
  - Real-time location updates (via background task + polling)
  - Tap marker to see member details
  - Tap own marker to see own location info
  - Swipe down to refresh manually
  - Show accuracy indicator (GPS signal strength)
  - Battery status indicator for current user (top-right corner)

### 4. Group Management Screen
- **Content**:
  - List of user's groups
  - Each group card shows:
    - Group name
    - Number of members
    - Last activity time
  - "Create New Group" button
  - "Join Group" button
- **Functionality**:
  - Create new group (generate shareable code)
  - Join existing group (via code or link)
  - Leave group
  - Delete group (if owner)
  - Tap group to view details

### 5. Group Details Screen
- **Content**:
  - Group name and description
  - List of members with:
    - Avatar
    - Name
    - Battery percentage
    - Last location update time
    - Distance from current user
  - "Leave Group" button
  - "Share Group Code" button
- **Functionality**:
  - View all members' status
  - Copy group code to clipboard
  - Share group via messaging apps
  - Leave group
  - Remove members (if owner)

### 6. Settings Screen
- **Content**:
  - Location update frequency (every 5s, 10s, 30s, 1min)
  - Background tracking toggle
  - Battery saver mode toggle
  - Notification preferences
  - Privacy settings
  - About app
  - Logout button
- **Functionality**:
  - Adjust location polling interval
  - Enable/disable background tracking
  - Enable/disable battery saver mode
  - Manage notification preferences
  - Logout and clear session

### 7. User Profile Screen
- **Content**:
  - User avatar
  - User name
  - Email
  - Current battery percentage
  - Current location accuracy
  - Groups joined count
  - Edit profile button
- **Functionality**:
  - View user information
  - Edit name/avatar
  - View location history (optional future feature)

---

## Key User Flows

### Flow 1: First-Time Setup
1. User launches app → Splash screen
2. Redirected to Login screen
3. Taps "Sign in with Manus"
4. OAuth login completes
5. App requests location permissions (foreground + background)
6. App requests battery permission
7. Redirected to Home/Map screen
8. Shown empty map (no groups yet)
9. Prompt to create or join a group

### Flow 2: Create and Share a Group
1. User on Home screen
2. Taps "Groups" tab → Group Management screen
3. Taps "Create New Group"
4. Enters group name
5. Group created, receives unique code (e.g., "KITA-ABC123")
6. Taps "Share Group Code"
7. Shares via messaging apps or copy to clipboard
8. Invited user receives code, joins group
9. Both users' locations now visible on each other's maps

### Flow 3: Real-Time Location Tracking
1. User A and User B are in same group
2. User A's location updates every 10 seconds (configurable)
3. Background task runs even when app is closed
4. Location + battery status sent to server
5. Server broadcasts to all group members
6. User B's map updates with User A's new position
7. Battery indicator updates in real-time

### Flow 4: Battery Status Monitoring
1. User's battery level is read via `expo-battery`
2. Battery status sent with each location update
3. Map marker color changes based on battery:
   - Green: >50%
   - Yellow: 20-50%
   - Red: <20%
4. Group details screen shows battery % for each member
5. Low battery warning notification (optional)

### Flow 5: Background Tracking
1. User enables "Background Tracking" in Settings
2. App registers background task via `expo-task-manager`
3. Even when app is closed, location updates continue
4. Interval: Every 5-30 seconds (configurable)
5. Requires: GPS + WiFi/Data connection
6. Battery consumption is higher in background mode
7. User can disable in Settings to save battery

---

## Color Choices

**Brand Colors:**
- **Primary Blue**: `#0066CC` - Main action buttons, active states
- **Success Green**: `#22C55E` - Battery >50%, online status
- **Warning Yellow**: `#FBBF24` - Battery 20-50%, caution states
- **Danger Red**: `#EF4444` - Battery <20%, errors
- **Background**: `#FFFFFF` (light), `#0F172A` (dark)
- **Surface**: `#F8FAFC` (light), `#1E293B` (dark)
- **Text**: `#1E293B` (light), `#F1F5F9` (dark)
- **Border**: `#E2E8F0` (light), `#334155` (dark)

**Map Marker Colors:**
- Own location: Primary Blue with glow effect
- Group member (>50% battery): Success Green
- Group member (20-50% battery): Warning Yellow
- Group member (<20% battery): Danger Red
- Offline/inactive: Gray

---

## Architecture Notes

### Frontend (React Native + Expo)
- **Map Library**: `expo-maps` (native maps without API key in Expo Go)
- **Location**: `expo-location` (foreground + background tracking)
- **Battery**: `expo-battery` (battery status monitoring)
- **Background Tasks**: `expo-task-manager` + `expo-background-fetch`
- **State Management**: React Context + AsyncStorage (local) + tRPC (server sync)
- **Real-Time Updates**: Polling via background task (no WebSocket for simplicity)

### Backend (Node.js + Express + tRPC)
- **Database**: MySQL/TiDB (store users, groups, locations, battery status)
- **API**: tRPC for type-safe queries and mutations
- **Authentication**: Manus OAuth (user identification)
- **Real-Time**: Polling-based (client fetches latest group member locations)
- **Location History**: Optional - store last 24h of locations for playback

### Database Schema
- **users**: id, openId, name, email, createdAt, updatedAt
- **groups**: id, name, ownerId, code, createdAt, updatedAt
- **group_members**: id, groupId, userId, joinedAt
- **locations**: id, userId, groupId, latitude, longitude, accuracy, batteryLevel, timestamp
- **battery_status**: id, userId, batteryLevel, isCharging, lastUpdated

---

## Technical Constraints & Solutions

| Challenge | Solution |
|-----------|----------|
| Real-time without WebSocket | Use polling via background task every 5-30s |
| Background tracking on iOS | Use `expo-task-manager` + `expo-background-fetch` |
| Battery drain | Implement battery saver mode (longer intervals) |
| Location accuracy | Show accuracy radius on map, use GPS + WiFi triangulation |
| Offline handling | Queue location updates, sync when online |
| Privacy | Only share location with group members, not public |
| Data usage | Compress location data, limit update frequency |

---

## Future Enhancements (Not in MVP)

- Location history playback (see where members traveled)
- Geofencing alerts (notify when member enters/leaves area)
- Emergency SOS button with location sharing
- Voice/video call integration
- Location sharing expiration (auto-stop after X hours)
- Group chat with location pins
- Offline map caching
- Multiple groups active simultaneously
