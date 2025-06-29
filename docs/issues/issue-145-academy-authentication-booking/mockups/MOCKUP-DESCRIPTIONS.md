# Academy Portal Mockup Descriptions

## Overview

I've created two comprehensive HTML mockups demonstrating the Academy portal with authentication, calendar booking, and video archive management features.

## 1. Academy Authenticated Portal (`academy-authenticated-portal.html`)

This mockup shows the **user-facing Academy portal** with the following features:

### Header with Authentication
- **Logo**: "Phialo Design" branding
- **Navigation**: Portfolio, Services, Academy (with dropdown), About, Contact
- **User Profile**: Shows logged-in user "Maria Schmidt" with avatar
- **Academy Dropdown Menu**:
  - Course Library (12 courses badge)
  - My Appointments submenu:
    - Book New Appointment
    - Upcoming Sessions (2 badge)
    - Past Sessions
    - Session Archives (5 badge)
  - My Learning Dashboard

### Dashboard Hero Section
- Welcome message: "Welcome back, Maria!"
- Quick action buttons: "Book New Appointment" and "Browse Courses"
- Statistics grid showing:
  - Completed Courses: 3
  - Consultations: 7
  - Next Appointment: 2 Days
  - Total Learning Time: 24h

### Appointment Management Section
Features a split-view layout:

**Left Sidebar**:
- Next appointment details (Friday, Feb 2, 2025, 14:00-15:00)
- Join and Reschedule buttons
- Booking policies reminder

**Right Calendar View**:
- Monthly calendar with available dates highlighted in gold
- Selected date (Feb 9) highlighted
- Time slot grid showing available times
- Interactive selection of dates and times

### Video Archive Section
- Filter bar with sort options and category filters
- Grid of video cards showing:
  - Thumbnail with duration overlay
  - Privacy badge (Private/Unlisted)
  - Video title and metadata
  - View count
  - Action buttons (Play, Notes, Download)
- Three example videos from past consultations

### Modal Window
- Booking modal for creating new appointments
- Session type selection
- Date and time preferences
- Topic/questions textarea

## 2. Admin Video Management (`academy-admin-video-management.html`)

This mockup shows the **admin interface** for Gesa to manage video content:

### Admin Header
- "Phialo Academy" with red "ADMIN" badge
- User shown as "Gesa Pickbrenner"
- Logout button

### Sidebar Navigation
- Dashboard
- Video Archive (active)
- Appointments
- Participants
- Courses
- Settings

### Main Content Area

**Statistics Dashboard**:
- Total Videos: 45 (+5 this week)
- Total Views: 312 (+23 this week)
- Active Participants: 18 (+2 this week)
- Storage Space: 8.2 GB (of 10 GB free)

**Toolbar**:
- Select all checkbox
- Search input for title, client, or tags
- Filter dropdowns for privacy level and date range
- Bulk actions: Change Privacy, Add Tags, Delete

**Video Table**:
- Checkbox for selection
- Thumbnail with video details
- Client name
- Upload date
- Privacy status with colored badges
- View count
- Action buttons per video (Edit, Privacy, Delete)

### Add Video Modal
Comprehensive form including:
- Link to appointment (optional dropdown)
- YouTube URL input with preview
- Video title
- Client/participant name
- Category selection
- Privacy settings (radio buttons):
  - Private - Only accessible with signed URL
  - Unlisted - Accessible with link
  - Public - Visible to all (not recommended)
- Access expiration date (optional)
- Tag management
- Session notes textarea
- Email notification checkbox

## Key Design Features

1. **Consistent Branding**: Uses Phialo's color scheme (gold, midnight blue, pearl)
2. **Responsive Design**: Mobile-friendly layouts
3. **Intuitive UI**: Clear navigation and action buttons
4. **Security Focus**: Privacy badges and access control options
5. **User-Friendly Admin**: Simple interface for non-technical users
6. **Cal.com Integration Ready**: Calendar interface designed for API integration
7. **YouTube Integration**: Direct URL input with metadata fetching

## Technical Implementation Notes

- Built with vanilla HTML/CSS for mockup purposes
- Uses CSS Grid and Flexbox for layouts
- Includes interactive JavaScript for modals and selection
- Designed to be easily converted to React components
- Follows Phialo's existing design system

These mockups demonstrate a complete solution for:
- User authentication in header
- Academy navigation with dropdown
- Appointment booking with calendar
- Video archive access for users
- Admin interface for easy video management