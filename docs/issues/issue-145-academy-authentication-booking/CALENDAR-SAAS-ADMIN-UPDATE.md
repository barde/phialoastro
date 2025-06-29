# Calendar SaaS Integration & Admin Interface Update

## 📅 Calendar Management SaaS Recommendation

After researching various calendar scheduling solutions, I recommend **Cal.com** as the primary calendar management solution for Phialo Academy, with **Zoho Bookings** as a strong alternative.

### Why Cal.com?

1. **Open Source & Self-Hostable**
   - Can be deployed on Cloudflare Workers/Pages
   - Full control over data and customization
   - White-label by design - perfect for Phialo branding
   - No vendor lock-in

2. **Robust API**
   - API v2 with comprehensive endpoints
   - Webhook support for real-time updates
   - API-driven architecture
   - Easy integration with existing Cloudflare stack

3. **Cost Effective**
   - Self-hosted version is free (only pay for infrastructure)
   - Cloud version has competitive pricing
   - Can start with self-hosted and migrate later

4. **Features**
   - Multi-language support (German/English)
   - Time zone handling
   - Calendar sync (Google, Outlook, etc.)
   - Custom booking forms
   - Availability management
   - Email notifications

### Alternative: Zoho Bookings

If self-hosting is not desired:
- **Pricing**: €6/month per user (very affordable)
- **Benefits**: 
  - Best free tier in market
  - Excellent API documentation
  - Part of Zoho suite (CRM integration)
  - Built-in payment processing

### Implementation Architecture with Cal.com

```typescript
// Cal.com API Integration Service
export class CalendarService {
  private calApiKey: string;
  private calApiUrl: string;
  
  constructor() {
    this.calApiKey = env.CAL_API_KEY;
    this.calApiUrl = env.CAL_API_URL || 'https://api.cal.com/v2';
  }
  
  async getAvailability(userId: string, dateRange: DateRange) {
    const response = await fetch(`${this.calApiUrl}/availability`, {
      headers: {
        'Authorization': `Bearer ${this.calApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        startDate: dateRange.start,
        endDate: dateRange.end
      })
    });
    return response.json();
  }
  
  async createBooking(bookingData: BookingRequest) {
    // Create booking via Cal.com API
    const booking = await this.calApi.bookings.create(bookingData);
    
    // Store in our D1 database for reference
    await this.storeBookingReference(booking);
    
    return booking;
  }
}
```

## 🎥 Video Archive Admin Interface

### Admin Dashboard Design

```typescript
// Video Archive Admin Component Structure
interface VideoArchiveAdmin {
  videos: VideoItem[];
  appointments: Appointment[];
  filters: FilterOptions;
  bulkActions: BulkAction[];
}

interface VideoItem {
  id: string;
  appointmentId: string;
  title: string;
  youtubeUrl: string;
  privacy: 'public' | 'unlisted' | 'private';
  uploadedAt: Date;
  expiresAt?: Date;
  thumbnailUrl: string;
  duration: number;
  views: number;
  tags: string[];
  notes?: string;
}
```

### Admin UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│ Video Archive Admin                                    [+ Add Video] │
├─────────────────────────────────────────────────────────────────┤
│ Search: [_______________] Filter: [All Videos ▼] [This Month ▼] │
├─────────────────────────────────────────────────────────────────┤
│ □ Select All  [Bulk Actions ▼]                   Showing 1-10 of 45 │
├─────────────────────────────────────────────────────────────────┤
│ □ ┌─────────┐ DNA Spiral Earrings - Consultation           │
│   │ [thumb] │ Client: Maria Schmidt                        │
│   │         │ Date: Jan 15, 2025 | Duration: 45:32         │
│   └─────────┘ Status: ● Unlisted | Views: 3               │
│               [Edit] [Change Privacy] [Delete]              │
├─────────────────────────────────────────────────────────────────┤
│ □ ┌─────────┐ Custom Ring Design - Follow-up              │
│   │ [thumb] │ Client: Thomas Meyer                         │
│   │         │ Date: Jan 12, 2025 | Duration: 32:15         │
│   └─────────┘ Status: ● Private | Views: 1                │
│               [Edit] [Change Privacy] [Delete]              │
└─────────────────────────────────────────────────────────────────┤
```

### Admin Features

#### 1. Video Management
```tsx
// Admin Video Management Component
const VideoArchiveAdmin = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  
  return (
    <AdminLayout>
      <AdminHeader>
        <h1>Video Archive Management</h1>
        <Button onClick={openAddVideoModal}>
          <Plus /> Add Video
        </Button>
      </AdminHeader>
      
      <AdminToolbar>
        <SearchInput placeholder="Search by title, client, or tags" />
        <FilterDropdown options={filterOptions} />
        <BulkActions 
          selectedCount={selectedVideos.length}
          actions={[
            { label: 'Change Privacy', action: bulkChangePrivacy },
            { label: 'Add Tags', action: bulkAddTags },
            { label: 'Delete', action: bulkDelete, danger: true }
          ]}
        />
      </AdminToolbar>
      
      <VideoGrid>
        {videos.map(video => (
          <VideoCard 
            key={video.id}
            video={video}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPrivacyChange={handlePrivacyChange}
          />
        ))}
      </VideoGrid>
    </AdminLayout>
  );
};
```

#### 2. Add/Edit Video Modal
```tsx
const VideoEditModal = ({ video, appointment, onSave }) => {
  return (
    <Modal title={video ? 'Edit Video' : 'Add Video'}>
      <Form onSubmit={handleSubmit}>
        <FormSection>
          <Label>Link to Appointment</Label>
          <AppointmentSelect 
            value={video?.appointmentId}
            appointments={upcomingAppointments}
          />
        </FormSection>
        
        <FormSection>
          <Label>YouTube URL*</Label>
          <Input 
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            pattern="https://(?:www\.)?youtube\.com/watch\?v=.+"
          />
          <HelperText>Paste the YouTube video URL</HelperText>
        </FormSection>
        
        <FormSection>
          <Label>Video Title*</Label>
          <Input 
            placeholder="e.g., DNA Spiral Earrings - Design Consultation"
            maxLength={100}
          />
        </FormSection>
        
        <FormSection>
          <Label>Privacy Setting*</Label>
          <RadioGroup>
            <Radio value="private">
              Private - Only accessible with signed URL
            </Radio>
            <Radio value="unlisted">
              Unlisted - Accessible with link
            </Radio>
            <Radio value="public">
              Public - Visible to all (not recommended)
            </Radio>
          </RadioGroup>
        </FormSection>
        
        <FormSection>
          <Label>Access Expiration</Label>
          <DatePicker 
            minDate={tomorrow}
            placeholder="Optional - Leave empty for no expiration"
          />
        </FormSection>
        
        <FormSection>
          <Label>Tags</Label>
          <TagInput 
            suggestions={['consultation', 'design-review', 'tutorial']}
          />
        </FormSection>
        
        <FormSection>
          <Label>Session Notes</Label>
          <Textarea 
            rows={4}
            placeholder="Add any notes about this session..."
          />
        </FormSection>
        
        <FormActions>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary">
            {video ? 'Update Video' : 'Add Video'}
          </Button>
        </FormActions>
      </Form>
    </Modal>
  );
};
```

#### 3. Bulk Operations
```typescript
// Bulk operation handlers
const bulkOperations = {
  async changePrivacy(videoIds: string[], privacy: VideoPrivacy) {
    const updates = videoIds.map(id => 
      updateVideoPrivacy(id, privacy)
    );
    await Promise.all(updates);
    toast.success(`Updated privacy for ${videoIds.length} videos`);
  },
  
  async addTags(videoIds: string[], tags: string[]) {
    const updates = videoIds.map(id => 
      addVideoTags(id, tags)
    );
    await Promise.all(updates);
    toast.success(`Added tags to ${videoIds.length} videos`);
  },
  
  async deleteVideos(videoIds: string[]) {
    if (!confirm(`Delete ${videoIds.length} videos? This cannot be undone.`)) {
      return;
    }
    
    const deletions = videoIds.map(id => deleteVideo(id));
    await Promise.all(deletions);
    toast.success(`Deleted ${videoIds.length} videos`);
  }
};
```

### Database Schema Update

```sql
-- Add admin-specific fields to session_archives
ALTER TABLE session_archives ADD COLUMN 
  title TEXT NOT NULL,
  tags TEXT, -- JSON array of tags
  notes TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  view_count INTEGER DEFAULT 0,
  created_by TEXT, -- admin user who added it
  updated_at DATETIME;

-- Create admin audit log
CREATE TABLE admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'video_added', 'video_updated', 'video_deleted'
  target_type TEXT NOT NULL, -- 'video', 'appointment', etc.
  target_id TEXT NOT NULL,
  changes TEXT, -- JSON of what changed
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Admin API Endpoints

```typescript
// Admin-only endpoints (require admin auth)
router.post('/api/admin/videos', requireAdmin, async (req) => {
  const video = await createVideo(req.body);
  await logAdminAction(req.admin, 'video_added', video.id);
  return video;
});

router.patch('/api/admin/videos/:id', requireAdmin, async (req) => {
  const video = await updateVideo(req.params.id, req.body);
  await logAdminAction(req.admin, 'video_updated', video.id, req.body);
  return video;
});

router.delete('/api/admin/videos/:id', requireAdmin, async (req) => {
  await deleteVideo(req.params.id);
  await logAdminAction(req.admin, 'video_deleted', req.params.id);
  return { success: true };
});

router.post('/api/admin/videos/bulk', requireAdmin, async (req) => {
  const { action, videoIds, data } = req.body;
  const results = await performBulkAction(action, videoIds, data);
  await logAdminAction(req.admin, `bulk_${action}`, videoIds);
  return results;
});

// YouTube metadata fetching
router.post('/api/admin/videos/fetch-metadata', requireAdmin, async (req) => {
  const { youtubeUrl } = req.body;
  const metadata = await fetchYouTubeMetadata(youtubeUrl);
  return metadata; // title, duration, thumbnail, etc.
});
```

### Admin Authentication

```typescript
// Simple admin authentication middleware
const ADMIN_EMAILS = ['info@phialo.de', 'gesa@phialo.de'];

export const requireAdmin = async (req: Request) => {
  const session = await getSession(req);
  
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    throw new Error('Unauthorized - Admin access required');
  }
  
  req.admin = session;
  return true;
};
```

### YouTube Integration Helper

```typescript
// YouTube URL parsing and metadata
export class YouTubeService {
  static extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
  
  static async fetchMetadata(videoId: string) {
    // Use YouTube Data API or oEmbed
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`
    );
    return response.json();
  }
  
  static generateThumbnailUrl(videoId: string, quality: 'default' | 'hq' = 'hq') {
    return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
  }
}
```

## 🚀 Implementation Updates

### Phase 3 Update: Calendar Integration (3 weeks)
- Week 1: Cal.com setup and API integration
- Week 2: Booking UI and availability management
- Week 3: Email notifications and calendar sync

### New Phase: Admin Interface (1 week)
- Day 1-2: Admin authentication and layout
- Day 3-4: Video CRUD operations
- Day 5: Bulk operations and YouTube integration

### Total Timeline: 10 weeks (was 9 weeks)

## 💰 Updated Cost Estimation

### Calendar SaaS Costs
- **Cal.com Self-Hosted**: €0/month (only infrastructure costs)
- **Cal.com Cloud**: ~€20-50/month depending on usage
- **Alternative - Zoho Bookings**: €6/month per user

### Development Costs
- Original: €39,500
- Admin Interface Addition: €3,500
- **New Total: €43,000**

## 🔒 Security Considerations for Admin

1. **Admin Access Control**
   - Whitelist specific email addresses
   - Two-factor authentication for admin accounts
   - IP restrictions (optional)
   - Audit logging for all admin actions

2. **Video Security**
   - Signed URLs with expiration
   - IP-based access restrictions
   - Watermarking capability
   - Download prevention options

3. **Data Protection**
   - Regular backups of video metadata
   - GDPR compliance for video storage
   - Clear data retention policies
   - User consent management

## 📝 Next Steps

1. **Decision Required**:
   - Choose between Cal.com (self-hosted) vs Zoho Bookings
   - Confirm admin email addresses
   - Define video retention policies

2. **Technical Setup**:
   - Deploy Cal.com or configure Zoho API
   - Set up YouTube API credentials
   - Create admin UI prototypes

3. **Testing Plan**:
   - Admin workflow testing
   - Calendar integration testing
   - Video upload/management testing
   - Security penetration testing