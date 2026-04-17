# PM / Designer Handbook — Instagram Clone

> **Audience:** Junior PMs, UI/UX Designers, Product Owners  
> **Goal:** Understand the product, design consistently, and plan features without breaking engineering velocity.

---

## 1. Product Vision

A mobile-first social media app that lets users:
1. Share photos/posts with captions
2. Share ephemeral 24h stories
3. Follow other users and build a social graph
4. Interact via likes and comments
5. Discover users through search

**MVP North Star:** A user can register → follow someone → see their posts/stories → like/comment → post their own content → edit profile → all in under 5 minutes.

---

## 2. User Flows (Current)

```
[Launch]
   └── Logged out?
        ├── LoginScreen
        └── RegisterScreen
   └── Logged in?
        └── MainTabNavigator
             ├── HomeTab
             │    ├── FeedScreen
             │    │    ├── Tap story ring → StoryViewerScreen
             │    │    ├── Double-tap post → Like
             │    │    ├── Tap comment → CommentsScreen
             │    │    └── Tap username → UserProfileScreen
             │    ├── CommentsScreen
             │    ├── PostDetailScreen
             │    ├── StoryViewerScreen
             │    └── CreateStoryScreen
             ├── SearchTab
             │    ├── SearchScreen
             │    └── UserProfileScreen
             ├── CreateTab
             │    └── CreatePostScreen
             └── ProfileTab
                  ├── ProfileScreen
                  ├── EditProfileScreen
                  ├── FollowersListScreen
                  ├── FollowingListScreen
                  ├── PostDetailScreen
                  └── UserProfileScreen
```

---

## 3. Design System

### 3.1 Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#0095f6` | Links, active buttons, Post button |
| `--danger` | `#ed4956` | Liked heart, logout, destructive actions |
| `--text-primary` | `#000000` | Main text, usernames |
| `--text-secondary` | `#666666` | Timestamps, subtext |
| `--border` | `#dbdbdb` | Input borders, dividers |
| `--bg-secondary` | `#efefef` | Secondary buttons, disabled states |

### 3.2 Typography
- **Username / Stats:** `font-weight: bold`, `14–18px`
- **Caption / Body:** `14px`, normal weight
- **Timestamp / Meta:** `12px`, `#666`
- **Screen Titles:** `16px`, bold, centered

### 3.3 Spacing Rules
- Screen padding: `12–16px`
- Avatar sizes:
  - Feed header: `32px`
  - Story ring: `66px` ring, `58px` avatar
  - Profile big avatar: `80px`
  - Search row: `44px`
- Post grid: `1px` gutter, square aspect ratio

### 3.4 Icons
Use `@expo/vector-icons` (`Ionicons`). Common mappings:
- Home: `home` / `home-outline`
- Search: `search` / `search-outline`
- Create: `add-circle` / `add-circle-outline`
- Profile: `person` / `person-outline`
- Like: `heart` (filled = red) / `heart-outline`
- Comment: `chatbubble-outline`
- Share: `paper-plane-outline`
- Back: `arrow-back`
- Close: `close`

---

## 4. Component Patterns

### Post Card Anatomy
1. **Header:** Avatar + username + optional location
2. **Media:** Square image(s), swipeable carousel (MVP shows first image)
3. **Actions:** Like, Comment, Share icons
4. **Stats:** Likes count
5. **Caption:** Bold username + caption text
6. **Comments CTA:** "View all X comments"
7. **Timestamp:** Relative date

### Story Ring Anatomy
- Outer ring: `2px` gradient border (`#ed4956` for MVP)
- Inner avatar: circular, slightly smaller
- Label: username below, truncated to 1 line
- **Your story** ring: gray border when no active story, gradient when active

### Profile Header Anatomy
1. Big avatar + stats row (Posts / Followers / Following)
2. Username + bio + website
3. Action buttons: Edit Profile / Follow / Message / Log Out
4. Post grid below

---

## 5. Feature Prioritization Template

When proposing a new feature, fill this out:

| Question | Answer |
|----------|--------|
| What user problem does this solve? | ... |
| Which screen(s) are affected? | ... |
| Does it need backend changes? | Yes / No |
| Does it need new assets/icons? | Yes / No |
| Estimated engineering days | ... |
| Can we A/B test or soft-launch? | Yes / No |
| Priority | P0 (blocker) / P1 (next sprint) / P2 (backlog) |

**Never change navigation structure without looping in the Frontend lead.** Navigation changes in React Native can be expensive.

---

## 6. Content Guidelines

- **Max caption length:** 2,200 characters (backend enforced)
- **Max comment length:** 1,000 characters
- **Bio max:** 150 characters
- **Image aspect:** 1:1 (square) or 4:5 recommended; backend resizes to `1080px` width
- **Story aspect:** 9:16 recommended; backend resizes to `720px` width

---

## 7. Accessibility Checklist

- [ ] All touch targets are at least `44×44px`
- [ ] Color contrast ratio ≥ 4.5:1 for body text
- [ ] Images have meaningful `accessibilityLabel` (or alt text in API)
- [ ] Form inputs have visible focus states
- [ ] Error messages are shown inline, not only via color

---

## 8. Analytics Events (Recommended)

Track these to understand engagement:
- `sign_up`, `log_in`, `log_out`
- `post_created`, `story_created`
- `like_toggled`, `comment_posted`
- `follow_toggled`
- `profile_viewed`, `search_performed`
- `feed_refresh`, `feed_paginated`

---

## 9. Common Pitfalls

1. **Don't design offline-first flows yet.** The app assumes connectivity.
2. **Don't add modals on top of modals.** Use full screens or bottom sheets sparingly.
3. **Don't require camera permission on first launch.** Defer until user taps Create.
4. **Keep copy concise.** Instagram users skim; walls of text kill engagement.
