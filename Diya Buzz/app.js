/**
 * DiyaBuzz - Social Media Web Application
 * Logic, State Management, Authentication, and LocalStorage Synchronization
 */

// Check if running in Node.js instead of browser
if (typeof window === 'undefined') {
  console.log('\n======================================================');
  console.log('ℹ️  app.js is a client-side browser script.');
  console.log('👉 To run DiyaBuzz, please run: node server.js');
  console.log('👉 Or open index.html directly in your web browser!');
  console.log('======================================================\n');
  process.exit(0);
}

(function () {
  'use strict';

  // 1. Initial State & Data Store
  const rawData = window.DIVABUZZ_RAW_DATA || {
    profiles: [],
    posts: [],
    stats: {},
    topTags: [],
    userReactions: {}
  };

  // Local Storage Keys
  const LS_ACTIVE_PROFILE = 'diyabuzz_active_profile_id';
  const LS_IS_LOGGED_IN = 'diyabuzz_is_logged_in';
  const LS_USER_POSTS = 'diyabuzz_custom_posts';
  const LS_REACTIONS = 'diyabuzz_user_reactions';
  const LS_ENGAGEMENTS = 'diyabuzz_custom_engagements';

  // State
  let state = {
    isLoggedIn: localStorage.getItem(LS_IS_LOGGED_IN) === 'true',
    currentView: 'feed', // 'feed' | 'my-posts' | 'manage-profiles' | 'analytics'
    currentFilter: 'all', // 'all' | 'published' | 'media' | 'draft' | 'my-posts'
    currentSort: 'newest', // 'newest' | 'reactions' | 'engagements'
    searchQuery: '',
    page: 1,
    pageSize: 20,
    activeProfileId: parseInt(localStorage.getItem(LS_ACTIVE_PROFILE) || '1', 10),
    isManageUnlocked: true,
    profilesMap: new Map(),
    posts: [],
    userReactions: {}, // "postId_profileId" -> "Heart" | "Thumbs" ...
    customEngagements: {} // postId -> [engagement, ...]
  };

  // Curated aesthetic fallback photography matching post tags
  const TAG_FALLBACK_IMAGES = {
    celebrations: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    sports: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
    happiness: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    photography: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    discussion: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    festival: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800&auto=format&fit=crop&q=80',
    gratitude: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    incredibleindia: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  };

  // Helper: Format Date
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // Helper: Format Time ago
  function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffSec = Math.floor((now - d) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return formatDate(dateStr);
    } catch (e) {
      return dateStr;
    }
  }

  // Calculate age from DOB
  function calculateAge(dobStr) {
    if (!dobStr) return null;
    const birth = new Date(dobStr);
    const diff = Date.now() - birth.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${type === 'success' ? '✨' : (type === 'error' ? '⚠️' : '🔥')}</span>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Safe HTML escape
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 2. Initialize Store
  function initData() {
    // Populate Profiles Map
    rawData.profiles.forEach(p => {
      state.profilesMap.set(p.ProfileID, p);
    });

    // Load Local User Reactions
    const savedReactions = JSON.parse(localStorage.getItem(LS_REACTIONS) || '{}');
    state.userReactions = Object.assign({}, rawData.userReactions, savedReactions);

    // Load Local Engagements
    state.customEngagements = JSON.parse(localStorage.getItem(LS_ENGAGEMENTS) || '{}');

    // Combine raw posts with custom user-created posts
    const customPosts = JSON.parse(localStorage.getItem(LS_USER_POSTS) || '[]');
    state.posts = [...customPosts, ...rawData.posts];

    // Ensure active profile exists
    if (!state.profilesMap.has(state.activeProfileId)) {
      state.activeProfileId = rawData.profiles[0]?.ProfileID || 1;
      localStorage.setItem(LS_ACTIVE_PROFILE, String(state.activeProfileId));
    }

    // Refresh UI elements
    updateAuthUI();
    renderWidgets();
    renderAnalyticsOverview();
    renderFeed();
  }

  // Current Active Profile
  function getActiveProfile() {
    return state.profilesMap.get(state.activeProfileId) || {
      ProfileID: 1,
      Name: 'Chirag Jadhav',
      Email: 'chirag.jadhav@example.net',
      Handle: 'chirag_jadhav',
      DOB: '1989-12-19',
      Initials: 'CJ',
      AvatarBg: '#f97316'
    };
  }

  // Update Header, Sidebar, and View access based on Login status
  function updateAuthUI() {
    const isLoggedIn = state.isLoggedIn;
    const user = getActiveProfile();

    // 1. Header controls
    const btnHeaderLogin = document.getElementById('btn-header-login');
    const headerUserSection = document.getElementById('header-user-section');
    const headerAvatar = document.getElementById('header-user-avatar');
    const headerName = document.getElementById('header-user-name');

    if (btnHeaderLogin && headerUserSection) {
      if (isLoggedIn) {
        btnHeaderLogin.style.display = 'none';
        headerUserSection.style.display = 'flex';
        if (headerAvatar) {
          headerAvatar.textContent = user.Initials || 'DB';
          headerAvatar.style.backgroundColor = user.AvatarBg || '#f97316';
        }
        if (headerName) headerName.textContent = user.Name;
      } else {
        btnHeaderLogin.style.display = 'inline-flex';
        headerUserSection.style.display = 'none';
      }
    }

    // 2. Sidebar Profile Card
    const sidebarBody = document.getElementById('sidebar-profile-body');
    const composeAvatar = document.getElementById('compose-avatar');
    if (composeAvatar) {
      composeAvatar.textContent = isLoggedIn ? (user.Initials || 'DB') : '👤';
      composeAvatar.style.backgroundColor = isLoggedIn ? (user.AvatarBg || '#f97316') : '#94a3b8';
    }

    const userPosts = state.posts.filter(p => p.ProfileID === user.ProfileID);
    let userEngagementsCount = 0;
    state.posts.forEach(p => {
      const engList = getPostEngagements(p.PostID);
      userEngagementsCount += engList.filter(e => e.ProfileID === user.ProfileID).length;
    });

    // Update My Posts badge in left nav
    const badgeMyPosts = document.getElementById('badge-my-posts-count');
    if (badgeMyPosts) {
      badgeMyPosts.textContent = isLoggedIn ? userPosts.length : '0';
    }

    if (sidebarBody) {
      if (isLoggedIn) {
        const age = calculateAge(user.DOB);
        sidebarBody.innerHTML = `
          <div class="profile-card-avatar" style="background-color: ${user.AvatarBg || '#f97316'};">
            ${escapeHtml(user.Initials || 'DB')}
          </div>
          <h2 class="profile-card-name">${escapeHtml(user.Name)}</h2>
          <div class="profile-card-handle">@${escapeHtml(user.Handle)}</div>
          
          <div class="profile-meta-tags">
            <span class="profile-badge">🎂 ${formatDate(user.DOB)}${age ? ` (${age} yrs)` : ''}</span>
            <span class="profile-badge">✉️ ${escapeHtml(user.Email)}</span>
          </div>

          <div class="profile-stats-row">
            <div class="profile-stat-item">
              <span class="stat-number">${userPosts.length}</span>
              <span class="stat-label">My Posts</span>
            </div>
            <div class="profile-stat-item">
              <span class="stat-number">${userEngagementsCount}</span>
              <span class="stat-label">Engagements</span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 14px;">
            <button class="btn-switch-account" style="flex: 1;" onclick="window.DiyaApp.showMyPosts()">
              View My Posts (${userPosts.length})
            </button>
            <button class="btn-header-logout" style="padding: 8px 12px; font-weight: 700;" onclick="window.DiyaApp.logoutProfile()" title="Log out of your profile">
              🚪 Log Out Profile
            </button>
          </div>
        `;
      } else {
        sidebarBody.innerHTML = `
          <div class="profile-card-avatar" style="background-color: #94a3b8;">
            👤
          </div>
          <h2 class="profile-card-name">Guest User</h2>
          <div class="profile-card-handle">Not logged in</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 10px 0 14px;">
            Log in with your name to view your profile details, share updates, and see your posts.
          </p>
          <button class="btn-primary" style="width: 100%; font-size: 0.84rem; padding: 9px;" onclick="window.DiyaApp.openLoginModal()">
            🔑 Log In with Name
          </button>
        `;
      }
    }

    // 3. User Spotlight Banner in Feed
    const spotlightEl = document.getElementById('feed-user-spotlight');
    if (spotlightEl) {
      if (isLoggedIn) {
        const age = calculateAge(user.DOB);
        spotlightEl.style.display = 'flex';
        spotlightEl.innerHTML = `
          <div class="spotlight-left">
            <div class="spotlight-avatar" style="background-color: ${user.AvatarBg || '#f97316'};">
              ${escapeHtml(user.Initials || 'DB')}
            </div>
            <div class="spotlight-info">
              <h3>
                <span>Welcome, ${escapeHtml(user.Name)}!</span>
                <span class="spotlight-badge">Active Profile</span>
              </h3>
              <p>@${escapeHtml(user.Handle)} • ✉️ ${escapeHtml(user.Email)}</p>
              <div class="spotlight-meta-row">
                <span>🎂 DOB: <strong>${formatDate(user.DOB)}</strong> ${age ? `(${age} years old)` : ''}</span>
                <span>📝 Your Posts: <strong>${userPosts.length}</strong></span>
                <span>⚡ Engagements: <strong>${userEngagementsCount}</strong></span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-primary" onclick="window.DiyaApp.showMyPosts()" style="font-size: 0.82rem; font-weight: 700; padding: 7px 18px;">
              View My Posts (${userPosts.length})
            </button>
          </div>
        `;
      } else {
        spotlightEl.style.display = 'none';
      }
    }

    // 4. Manage View access control (Requires profile login and unlocked state)
    const lockedBox = document.getElementById('manage-profiles-locked');
    const unlockedBox = document.getElementById('manage-profiles-unlocked');
    if (lockedBox && unlockedBox) {
      if (isLoggedIn && state.isManageUnlocked) {
        lockedBox.style.display = 'none';
        unlockedBox.style.display = 'flex';
        renderManageProfiles();
      } else {
        lockedBox.style.display = 'flex';
        unlockedBox.style.display = 'none';
        renderManageLockedState();
      }
    }
  }

  // Get all engagements for a post (combining raw & custom)
  function getPostEngagements(postId) {
    const rawPost = state.posts.find(p => p.PostID === postId);
    const rawEng = rawPost ? (rawPost.Engagements || []) : [];
    const customEng = state.customEngagements[postId] || [];
    return [...customEng, ...rawEng];
  }

  // 3. Render Posts Feed
  function renderFeed(resetPage = false) {
    if (resetPage) state.page = 1;

    const container = document.getElementById('posts-container');
    if (!container) return;

    // Filter Posts
    let filtered = state.posts.filter(p => {
      // Status & category filter
      if (state.currentFilter === 'published' && p.PostStatus !== 'Published') return false;
      if (state.currentFilter === 'draft' && p.PostStatus !== 'Draft') return false;
      if (state.currentFilter === 'media' && !p.PostMedia) return false;
      if (state.currentFilter === 'my-posts') {
        if (!state.isLoggedIn) return false;
        if (p.ProfileID !== state.activeProfileId) return false;
      }

      // Search Query filter
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase().trim();
        const author = state.profilesMap.get(p.ProfileID);
        const authorName = author ? author.Name.toLowerCase() : '';
        const authorHandle = author ? author.Handle.toLowerCase() : '';
        const postText = (p.PostText || '').toLowerCase();
        const hasTag = (p.Tags || []).some(t => t.toLowerCase().includes(q.replace('#', '')));

        if (!postText.includes(q) && !authorName.includes(q) && !authorHandle.includes(q) && !hasTag) {
          return false;
        }
      }

      return true;
    });

    // Sort Posts
    if (state.currentSort === 'reactions') {
      filtered.sort((a, b) => (b.Reactions?.Total || 0) - (a.Reactions?.Total || 0));
    } else if (state.currentSort === 'engagements') {
      filtered.sort((a, b) => getPostEngagements(b.PostID).length - getPostEngagements(a.PostID).length);
    } else {
      // Newest first
      filtered.sort((a, b) => (new Date(b.PostTime || 0)) - (new Date(a.PostTime || 0)));
    }

    // Pagination
    const visibleCount = state.page * state.pageSize;
    const postsToShow = filtered.slice(0, visibleCount);

    if (postsToShow.length === 0) {
      const user = getActiveProfile();
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">
            ${state.currentFilter === 'my-posts' ? `No posts yet by ${escapeHtml(user.Name)}` : 'No buzz found'}
          </h3>
          <p class="empty-desc">
            ${state.currentFilter === 'my-posts' 
              ? 'Use the compose box above to share your first buzz!' 
              : 'No posts matched your current filter or search query. Try clearing search or changing filters.'}
          </p>
        </div>
      `;
      const loadMoreBtn = document.getElementById('btn-load-more');
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    container.innerHTML = postsToShow.map(p => renderPostCardHtml(p)).join('');

    // Load More Button visibility
    const loadMoreBtn = document.getElementById('btn-load-more');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = (visibleCount < filtered.length) ? 'inline-block' : 'none';
    }
  }

  // HTML generator for a single Post Card
  function renderPostCardHtml(post) {
    const author = state.profilesMap.get(post.ProfileID) || {
      Name: `User #${post.ProfileID}`,
      Handle: `user_${post.ProfileID}`,
      Initials: 'U',
      AvatarBg: '#64748b'
    };

    const reactions = post.Reactions || { Total: 0, Heart: 0, Thumbs: 0, Anger: 0, Happy: 0, Sad: 0 };
    const userReactKey = `${post.PostID}_${state.activeProfileId}`;
    const myCurrentReaction = state.isLoggedIn ? (state.userReactions[userReactKey] || null) : null;

    // Convert hashtags into clickable spans
    const formattedText = escapeHtml(post.PostText || '').replace(
      /#(\w+)/g,
      '<span class="hashtag" onclick="window.DiyaApp.filterByTag(\'$1\')">#$1</span>'
    );

    // Media element
    let mediaHtml = '';
    if (post.PostMedia) {
      const isVideo = post.PostMedia.endsWith('.mp4');
      let fallbackImg = TAG_FALLBACK_IMAGES.default;
      if (post.Tags && post.Tags.length > 0) {
        const firstTag = post.Tags[0].toLowerCase();
        if (TAG_FALLBACK_IMAGES[firstTag]) {
          fallbackImg = TAG_FALLBACK_IMAGES[firstTag];
        }
      }

      if (isVideo) {
        mediaHtml = `
          <div class="post-media-container">
            <img class="post-media-img" src="${fallbackImg}" alt="Post video thumbnail" loading="lazy">
            <span class="post-media-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Video Attachment
            </span>
          </div>
        `;
      } else {
        mediaHtml = `
          <div class="post-media-container">
            <img class="post-media-img" src="${fallbackImg}" alt="Post attachment" loading="lazy" onerror="this.src='${TAG_FALLBACK_IMAGES.default}'">
            <span class="post-media-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Photo
            </span>
          </div>
        `;
      }
    }

    const engagements = getPostEngagements(post.PostID);

    return `
      <article class="post-card" id="post-${post.PostID}">
        <!-- Post Header -->
        <div class="post-header">
          <div class="post-author-box" onclick="window.DiyaApp.viewProfile(${post.ProfileID})">
            <div class="post-author-avatar" style="background-color: ${author.AvatarBg || '#f97316'};">
              ${escapeHtml(author.Initials || 'DB')}
            </div>
            <div class="post-author-meta">
              <div class="post-author-name">
                <span>${escapeHtml(author.Name)}</span>
                <span class="post-status-tag ${post.PostStatus.toLowerCase()}">${post.PostStatus}</span>
              </div>
              <div class="post-time-badge">
                <span>@${escapeHtml(author.Handle)}</span>
                <span>•</span>
                <span>${formatTimeAgo(post.PostTime)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Post Content -->
        <div class="post-body">
          ${formattedText}
        </div>

        <!-- Media Attachment -->
        ${mediaHtml}

        <!-- Reaction & Engagement Action Bar -->
        <div class="post-reaction-bar">
          <div class="reaction-buttons-cluster">
            <!-- Heart Reaction -->
            <button class="btn-react ${myCurrentReaction === 'Heart' ? 'active-heart' : ''}" 
                    onclick="window.DiyaApp.toggleReaction(${post.PostID}, 'Heart')" 
                    title="Love">
              <span class="react-emoji">❤️</span>
              <span class="react-count">${reactions.Heart || 0}</span>
            </button>

            <!-- Thumbs Up Reaction -->
            <button class="btn-react ${myCurrentReaction === 'Thumbs' ? 'active-thumbs' : ''}" 
                    onclick="window.DiyaApp.toggleReaction(${post.PostID}, 'Thumbs')" 
                    title="Like">
              <span class="react-emoji">👍</span>
              <span class="react-count">${reactions.Thumbs || 0}</span>
            </button>

            <!-- Happy / Laugh Reaction -->
            <button class="btn-react ${myCurrentReaction === 'Happy' ? 'active-happy' : ''}" 
                    onclick="window.DiyaApp.toggleReaction(${post.PostID}, 'Happy')" 
                    title="Happy">
              <span class="react-emoji">😄</span>
              <span class="react-count">${reactions.Happy || 0}</span>
            </button>

            <!-- Sad Reaction -->
            <button class="btn-react ${myCurrentReaction === 'Sad' ? 'active-sad' : ''}" 
                    onclick="window.DiyaApp.toggleReaction(${post.PostID}, 'Sad')" 
                    title="Sad">
              <span class="react-emoji">😢</span>
              <span class="react-count">${reactions.Sad || 0}</span>
            </button>

            <!-- Anger Reaction -->
            <button class="btn-react ${myCurrentReaction === 'Anger' ? 'active-anger' : ''}" 
                    onclick="window.DiyaApp.toggleReaction(${post.PostID}, 'Anger')" 
                    title="Angry">
              <span class="react-emoji">😡</span>
              <span class="react-count">${reactions.Anger || 0}</span>
            </button>
          </div>

          <!-- Engagements Drawer Toggle -->
          <button class="btn-toggle-engagements" onclick="window.DiyaApp.toggleEngagementDrawer(${post.PostID})">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>${engagements.length} Replies & Actions</span>
          </button>
        </div>

        <!-- Engagements Drawer (Text Replies + Button Actions) -->
        <div class="engagements-drawer" id="engagements-drawer-${post.PostID}">
          <!-- Quick Engagement Buttons -->
          <div class="engagement-quick-buttons-bar">
            <span class="quick-action-label">Quick Tap:</span>
            <button class="btn-quick-engage" onclick="window.DiyaApp.submitButtonEngagement(${post.PostID}, 'Agree')">👍 Agree</button>
            <button class="btn-quick-engage" onclick="window.DiyaApp.submitButtonEngagement(${post.PostID}, 'Well said')">👏 Well said</button>
            <button class="btn-quick-engage" onclick="window.DiyaApp.submitButtonEngagement(${post.PostID}, 'Congratulations')">🎉 Congratulations</button>
            <button class="btn-quick-engage" onclick="window.DiyaApp.submitButtonEngagement(${post.PostID}, 'Repost')">🔄 Repost</button>
            <button class="btn-quick-engage" onclick="window.DiyaApp.submitButtonEngagement(${post.PostID}, 'Save')">🔖 Save</button>
            <button class="btn-quick-engage" onclick="window.DiyaApp.submitButtonEngagement(${post.PostID}, 'Share')">↗️ Share</button>
          </div>

          <!-- Text Comment Composer -->
          <div class="engagement-compose-row">
            <input type="text" 
                   id="reply-input-${post.PostID}" 
                   class="engagement-input" 
                   placeholder="${state.isLoggedIn ? `Write a thoughtful reply as ${escapeHtml(getActiveProfile().Name)}...` : 'Log in to write a reply...'}"
                   onkeydown="if(event.key==='Enter') window.DiyaApp.submitTextEngagement(${post.PostID})">
            <button class="btn-send-reply" onclick="window.DiyaApp.submitTextEngagement(${post.PostID})">
              Reply
            </button>
          </div>

          <!-- List of Existing Engagements -->
          <div class="engagements-list" id="engagements-list-${post.PostID}">
            ${renderEngagementsListHtml(engagements)}
          </div>
        </div>
      </article>
    `;
  }

  // Render comments/engagements list HTML
  function renderEngagementsListHtml(engagements) {
    if (!engagements || engagements.length === 0) {
      return `<div style="text-align: center; padding: 12px; color: var(--text-light); font-size: 0.82rem;">No replies yet. Be the first to engage!</div>`;
    }

    return engagements.map(e => {
      const author = state.profilesMap.get(e.ProfileID) || {
        Name: `User #${e.ProfileID}`,
        Initials: 'U',
        AvatarBg: '#94a3b8'
      };
      const isButton = e.ReplyType === 'Button';

      return `
        <div class="engagement-item">
          <div class="engagement-avatar" style="background-color: ${author.AvatarBg || '#f97316'};">
            ${escapeHtml(author.Initials || 'U')}
          </div>
          <div class="engagement-content">
            <div class="engagement-meta">
              <span class="engagement-author">${escapeHtml(author.Name)}</span>
              <span class="engagement-type-badge ${isButton ? 'button' : 'text'}">
                ${isButton ? '⚡ ' + escapeHtml(e.ReplyText) : '💬 Reply'}
              </span>
              <span class="engagement-time">${formatTimeAgo(e.ReplyTime)}</span>
            </div>
            ${!isButton ? `<div class="engagement-text">${escapeHtml(e.ReplyText)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Interactive Reaction Handler
  function toggleReaction(postId, reactionType) {
    if (!state.isLoggedIn) {
      showToast('Please log in with your name to react to posts!', 'error');
      openLoginModal('Please log in to react to posts');
      return;
    }

    const post = state.posts.find(p => p.PostID === postId);
    if (!post) return;

    if (!post.Reactions) {
      post.Reactions = { Total: 0, Heart: 0, Thumbs: 0, Anger: 0, Happy: 0, Sad: 0 };
    }

    const key = `${postId}_${state.activeProfileId}`;
    const previousReaction = state.userReactions[key];

    if (previousReaction === reactionType) {
      // Toggle off
      delete state.userReactions[key];
      post.Reactions[reactionType] = Math.max(0, (post.Reactions[reactionType] || 1) - 1);
      post.Reactions.Total = Math.max(0, (post.Reactions.Total || 1) - 1);
      showToast(`Removed your ${reactionType} reaction`, 'info');
    } else {
      if (previousReaction) {
        post.Reactions[previousReaction] = Math.max(0, (post.Reactions[previousReaction] || 1) - 1);
      } else {
        post.Reactions.Total = (post.Reactions.Total || 0) + 1;
      }

      state.userReactions[key] = reactionType;
      post.Reactions[reactionType] = (post.Reactions[reactionType] || 0) + 1;
      showToast(`You reacted with ${reactionType}!`, 'success');
    }

    localStorage.setItem(LS_REACTIONS, JSON.stringify(state.userReactions));

    const cardEl = document.getElementById(`post-${postId}`);
    if (cardEl) {
      cardEl.outerHTML = renderPostCardHtml(post);
    }
  }

  // 5. Engagement Handlers
  function submitTextEngagement(postId) {
    if (!state.isLoggedIn) {
      showToast('Please log in with your name to write replies!', 'error');
      openLoginModal('Please log in to reply to posts');
      return;
    }

    const input = document.getElementById(`reply-input-${postId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
      showToast('Please type a reply before sending', 'info');
      return;
    }

    createEngagement(postId, 'Text', text);
    input.value = '';
  }

  function submitButtonEngagement(postId, actionLabel) {
    if (!state.isLoggedIn) {
      showToast('Please log in with your name to engage with posts!', 'error');
      openLoginModal('Please log in to engage with posts');
      return;
    }

    createEngagement(postId, 'Button', actionLabel);
  }

  function createEngagement(postId, replyType, replyText) {
    const activeUser = getActiveProfile();
    const newEngagement = {
      EngagementID: Date.now(),
      PostID: postId,
      ProfileID: activeUser.ProfileID,
      ReplyType: replyType,
      ReplyText: replyText,
      ReplyTime: new Date().toISOString()
    };

    if (!state.customEngagements[postId]) {
      state.customEngagements[postId] = [];
    }
    state.customEngagements[postId].unshift(newEngagement);
    localStorage.setItem(LS_ENGAGEMENTS, JSON.stringify(state.customEngagements));

    showToast(`Engaged on post with "${replyText}"!`, 'success');

    const listEl = document.getElementById(`engagements-list-${postId}`);
    if (listEl) {
      const allEng = getPostEngagements(postId);
      listEl.innerHTML = renderEngagementsListHtml(allEng);
    }

    const post = state.posts.find(p => p.PostID === postId);
    if (post) {
      const cardEl = document.getElementById(`post-${postId}`);
      if (cardEl) {
        cardEl.outerHTML = renderPostCardHtml(post);
        const newDrawer = document.getElementById(`engagements-drawer-${postId}`);
        if (newDrawer) newDrawer.classList.add('open');
      }
    }

    updateAuthUI();
  }

  function toggleEngagementDrawer(postId) {
    const drawer = document.getElementById(`engagements-drawer-${postId}`);
    if (drawer) {
      drawer.classList.toggle('open');
    }
  }

  // 6. Post Creation
  function createNewPost(postText, mediaUrl = null, status = 'Published') {
    if (!state.isLoggedIn) {
      showToast('Please log in with your name to create posts!', 'error');
      openLoginModal('Please log in to create posts');
      return false;
    }

    if (!postText.trim()) {
      showToast('Please write some content for your post!', 'info');
      return false;
    }

    const activeUser = getActiveProfile();
    const tags = (postText.match(/#(\w+)/g) || []).map(t => t.replace('#', ''));

    const newPost = {
      PostID: Date.now(),
      ProfileID: activeUser.ProfileID,
      PostMedia: mediaUrl ? mediaUrl.trim() : null,
      PostText: postText.trim(),
      PostTime: new Date().toISOString(),
      PostStatus: status,
      Tags: tags,
      Reactions: { Total: 0, Heart: 0, Thumbs: 0, Anger: 0, Happy: 0, Sad: 0 },
      Engagements: []
    };

    state.posts.unshift(newPost);

    const customPosts = JSON.parse(localStorage.getItem(LS_USER_POSTS) || '[]');
    customPosts.unshift(newPost);
    localStorage.setItem(LS_USER_POSTS, JSON.stringify(customPosts));

    showToast('Your buzz has been published!', 'success');
    updateAuthUI();
    renderFeed(true);
    return true;
  }

  // 7. Manage Center View (Analytics & All 500 Profiles Details)
  function renderManageProfiles() {
    // 1. Render Platform Analytics
    renderAnalyticsOverview();

    // 2. Render All Profiles Details Table
    const tbody = document.getElementById('manage-profiles-tbody');
    if (!tbody) return;

    const searchInput = document.getElementById('directory-search');
    const query = (searchInput?.value || '').toLowerCase().trim();

    const filtered = rawData.profiles.filter(p => {
      if (!query) return true;
      return p.Name.toLowerCase().includes(query) ||
             p.Email.toLowerCase().includes(query) ||
             p.Handle.toLowerCase().includes(query) ||
             (p.DOB && p.DOB.includes(query)) ||
             String(p.ProfileID) === query;
    });

    const countBadge = document.getElementById('directory-count');
    if (countBadge) {
      countBadge.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted); font-size: 0.95rem;">
            🔍 No profiles found matching "${escapeHtml(query)}"
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const age = calculateAge(p.DOB);
      const isCurrent = state.isLoggedIn && (p.ProfileID === state.activeProfileId);
      const postsCount = state.posts.filter(post => post.ProfileID === p.ProfileID).length;

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="user-avatar-mini" style="background-color: ${p.AvatarBg || '#f97316'}; flex-shrink: 0;">
                ${escapeHtml(p.Initials || 'U')}
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>${escapeHtml(p.Name)}</span>
                  ${isCurrent ? '<span style="font-size: 0.65rem; background: var(--brand-gradient); color: #fff; padding: 1px 6px; border-radius: 4px; font-weight: 800;">YOU</span>' : ''}
                </div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">@${escapeHtml(p.Handle)} (ID: #${p.ProfileID})</div>
              </div>
            </div>
          </td>
          <td>
            <div style="color: var(--text-primary); font-weight: 500;">${escapeHtml(p.Email)}</div>
            ${p.AlternateEmail ? `<div style="font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(p.AlternateEmail)}</div>` : ''}
          </td>
          <td>
            <div>${formatDate(p.DOB)}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${age ? `${age} years old` : ''}</div>
          </td>
          <td>
            <span style="font-weight: 700; background: var(--bg-surface-secondary); padding: 3px 8px; border-radius: 6px;">
              ${postsCount} posts
            </span>
          </td>
          <td>
            <button class="btn-details-mini" onclick="window.DiyaApp.viewProfile(${p.ProfileID})" title="View complete details of ${escapeHtml(p.Name)}">
              Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 8. Analytics & Metrics View
  function renderAnalyticsOverview() {
    const stats = rawData.stats || {};
    const totalPublished = document.getElementById('stat-total-published');
    const totalDrafts = document.getElementById('stat-total-drafts');
    const totalMedia = document.getElementById('stat-total-media');
    const totalReplies = document.getElementById('stat-total-replies');

    if (totalPublished) totalPublished.textContent = (stats.publishedPosts || 2380).toLocaleString();
    if (totalDrafts) totalDrafts.textContent = (stats.draftPosts || 32).toLocaleString();
    if (totalMedia) totalMedia.textContent = (stats.mediaPosts || 1200).toLocaleString();
    if (totalReplies) totalReplies.textContent = (stats.totalEngagements || 7148).toLocaleString();

    // Reaction Stacked Bar
    const stackedBar = document.getElementById('reaction-stacked-bar');
    const legend = document.getElementById('reaction-legend');
    if (!stackedBar || !legend) return;

    let hearts = 0, thumbs = 0, happy = 0, sad = 0, anger = 0;
    state.posts.forEach(p => {
      if (p.Reactions) {
        hearts += p.Reactions.Heart || 0;
        thumbs += p.Reactions.Thumbs || 0;
        happy += p.Reactions.Happy || 0;
        sad += p.Reactions.Sad || 0;
        anger += p.Reactions.Anger || 0;
      }
    });

    const totalReactions = hearts + thumbs + happy + sad + anger || 1;
    const items = [
      { name: 'Thumbs', label: '👍 Like', count: thumbs, color: '#0284c7' },
      { name: 'Heart', label: '❤️ Love', count: hearts, color: '#e11d48' },
      { name: 'Happy', label: '😄 Happy', count: happy, color: '#f59e0b' },
      { name: 'Sad', label: '😢 Sad', count: sad, color: '#6366f1' },
      { name: 'Anger', label: '😡 Anger', count: anger, color: '#ea580c' }
    ];

    stackedBar.innerHTML = items.map(item => {
      const pct = ((item.count / totalReactions) * 100).toFixed(1);
      return `<div class="reaction-bar-segment" style="width: ${pct}%; background-color: ${item.color};" title="${item.label}: ${item.count} (${pct}%)"></div>`;
    }).join('');

    legend.innerHTML = items.map(item => {
      const pct = ((item.count / totalReactions) * 100).toFixed(1);
      return `
        <div class="reaction-legend-item">
          <span style="width: 12px; height: 12px; border-radius: 3px; background: ${item.color}; display: inline-block;"></span>
          <span style="font-weight: 700; font-size: 0.82rem;">${item.label}</span>
          <span style="margin-left: auto; font-size: 0.76rem; color: var(--text-muted);">${pct}%</span>
        </div>
      `;
    }).join('');
  }

  // 9. Widgets
  function renderWidgets() {
    const tagsContainer = document.getElementById('trending-tags-container');
    if (tagsContainer) {
      const tags = rawData.topTags || [];
      tagsContainer.innerHTML = tags.slice(0, 6).map(([tag, count]) => `
        <div class="trending-item" onclick="window.DiyaApp.filterByTag('${escapeHtml(tag)}')">
          <span class="trending-tag-name">#${escapeHtml(tag)}</span>
          <span class="trending-count">${count} buzz</span>
        </div>
      `).join('');
    }

    renderSuggestedProfiles();
  }

  function renderSuggestedProfiles() {
    const container = document.getElementById('suggested-profiles-container');
    if (!container) return;

    const available = rawData.profiles.filter(p => p.ProfileID !== state.activeProfileId);
    const shuffled = [...available].sort(() => 0.5 - Math.random()).slice(0, 4);

    container.innerHTML = shuffled.map(p => `
      <div class="suggested-item">
        <div class="suggested-user-info" onclick="window.DiyaApp.viewProfile(${p.ProfileID})" style="cursor: pointer;">
          <div class="suggested-avatar" style="background-color: ${p.AvatarBg || '#f97316'};">
            ${escapeHtml(p.Initials || 'U')}
          </div>
          <div class="suggested-details">
            <div class="suggested-name">${escapeHtml(p.Name)}</div>
            <div class="suggested-handle">@${escapeHtml(p.Handle)}</div>
          </div>
        </div>
        <button class="btn-details-mini" style="padding: 4px 12px; font-size: 0.74rem;" onclick="window.DiyaApp.viewProfile(${p.ProfileID})">
          Details
        </button>
      </div>
    `).join('');
  }

  // 10. Login Modal & Logic
  function openLoginModal(customNotice = '') {
    const modal = document.getElementById('modal-login');
    const input = document.getElementById('login-name-input');
    const errBox = document.getElementById('login-error-msg');
    const suggBox = document.getElementById('login-suggestions');

    if (!modal || !input) return;

    input.value = '';
    if (suggBox) suggBox.style.display = 'none';

    if (errBox) {
      if (customNotice) {
        errBox.textContent = customNotice;
        errBox.style.color = 'var(--brand-primary)';
        errBox.style.display = 'block';
      } else {
        errBox.style.display = 'none';
      }
    }

    modal.classList.add('open');
    setTimeout(() => input.focus(), 150);

    // Dynamic autocomplete as user types
    input.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q || !suggBox) {
        if (suggBox) suggBox.style.display = 'none';
        return;
      }

      const matches = rawData.profiles.filter(p => p.Name.toLowerCase().includes(q)).slice(0, 5);
      if (matches.length > 0) {
        suggBox.innerHTML = matches.map(p => `
          <div class="login-suggestion-item" onclick="window.DiyaApp.selectQuickLogin('${escapeHtml(p.Name)}')">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="user-avatar-mini" style="background-color: ${p.AvatarBg || '#f97316'}; width: 26px; height: 26px; font-size: 0.72rem;">
                ${escapeHtml(p.Initials || 'U')}
              </div>
              <div>
                <strong style="font-size: 0.85rem;">${escapeHtml(p.Name)}</strong>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(p.Email)}</div>
              </div>
            </div>
            <span style="font-size: 0.75rem; color: var(--brand-primary); font-weight: 600;">Select ↵</span>
          </div>
        `).join('');
        suggBox.style.display = 'block';
      } else {
        suggBox.style.display = 'none';
      }
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        submitLoginWithName();
      }
    };
  }

  function submitLoginWithName(explicitName) {
    const input = document.getElementById('login-name-input');
    const errBox = document.getElementById('login-error-msg');

    let enteredName = (explicitName !== undefined && explicitName !== null) ? String(explicitName).trim() : '';
    if (!enteredName && input) {
      enteredName = input.value.trim();
    }

    if (!enteredName) {
      if (errBox) {
        errBox.textContent = 'Please enter your name to log in!';
        errBox.style.color = 'var(--danger)';
        errBox.style.display = 'block';
      }
      return;
    }

    // Find profile in profiles
    const normalized = enteredName.toLowerCase();
    let matched = rawData.profiles.find(p => p.Name.toLowerCase() === normalized);

    // If no exact match, try prefix or contains match
    if (!matched) {
      matched = rawData.profiles.find(p => p.Name.toLowerCase().includes(normalized));
    }

    // If not matched, automatically create user profile on the fly
    if (!matched) {
      const maxId = rawData.profiles.reduce((max, p) => Math.max(max, p.ProfileID || 0), 0);
      const newId = maxId + 1;
      const cleanHandle = enteredName.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${newId}`;
      const initials = enteredName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
      matched = {
        ProfileID: newId,
        Name: enteredName,
        Email: `${cleanHandle}@diyabuzz.local`,
        Handle: cleanHandle,
        DOB: '2000-01-01',
        Status: 'Active',
        Bio: 'DiyaBuzz community member',
        AvatarBg: '#f97316',
        Initials: initials
      };
      rawData.profiles.push(matched);
      state.profilesMap.set(newId, matched);
    }

    // Login successful
    loginUser(matched.ProfileID);
    closeModals();
  }

  function submitInlineLogin() {
    const input = document.getElementById('manage-inline-name-input');
    const errBox = document.getElementById('manage-inline-error-msg');
    const val = input ? input.value.trim() : '';

    if (!val) {
      if (errBox) {
        errBox.textContent = 'Please enter your name to log in!';
        errBox.style.display = 'block';
      }
      return;
    }

    state.pendingManageOpen = true;
    submitLoginWithName(val);
  }

  function loginUser(profileId) {
    state.activeProfileId = profileId;
    state.isLoggedIn = true;
    state.isManageUnlocked = true;
    localStorage.setItem(LS_ACTIVE_PROFILE, String(profileId));
    localStorage.setItem(LS_IS_LOGGED_IN, 'true');

    const user = getActiveProfile();
    updateAuthUI();
    showToast(`Logged in as ${user.Name}!`, 'success');

    if (state.pendingManageOpen || state.currentView === 'manage-profiles' || state.currentView === 'analytics') {
      state.pendingManageOpen = false;
      window.DiyaApp.switchView('manage-profiles');
    } else {
      window.DiyaApp.switchView('feed');
    }
  }

  // Manage View locked state renderer (handles Logged-in vs Logged-out)
  function renderManageLockedState() {
    const lockedBox = document.getElementById('manage-profiles-locked');
    if (!lockedBox) return;

    if (state.isLoggedIn) {
      const user = getActiveProfile();
      lockedBox.innerHTML = `
        <div class="lock-big-icon" style="font-size: 2.8rem; margin-bottom: 8px;">🔒</div>
        <h2 style="font-family: 'Outfit'; font-size: 1.45rem; font-weight: 800;">Manage Center is Locked</h2>
        <div style="display: inline-flex; align-items: center; gap: 8px; background: var(--brand-gradient-soft); padding: 8px 18px; border-radius: 999px; margin: 10px auto 14px; border: 1px solid var(--border-subtle);">
          <span style="font-size: 0.85rem; color: var(--brand-primary); font-weight: 700;">Active Account:</span>
          <span style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">${escapeHtml(user.Name)}</span>
        </div>
        <p style="color: var(--text-secondary); max-width: 480px; font-size: 0.92rem; margin: 0 auto 18px;">
          Your profile account is active. Manage Center (Private Profile & Analytics) is locked. Click unlock below to access Manage.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; align-items: center; max-width: 420px; width: 100%; margin: 0 auto; flex-wrap: wrap;">
          <button class="btn-primary" onclick="window.DiyaApp.unlockManage()" style="white-space: nowrap; padding: 11px 26px; font-weight: 700;">
            🔓 Unlock Manage Center
          </button>
          <button class="btn-secondary" onclick="window.DiyaApp.logoutProfile()" style="white-space: nowrap; padding: 11px 18px; font-weight: 600;">
            🚪 Log Out Profile Account
          </button>
        </div>
      `;
    } else {
      lockedBox.innerHTML = `
        <div class="lock-big-icon" style="font-size: 2.8rem; margin-bottom: 8px;">🔑</div>
        <h2 style="font-family: 'Outfit'; font-size: 1.4rem; font-weight: 800;">Log In to Access Manage Center</h2>
        <p style="color: var(--text-secondary); max-width: 480px; font-size: 0.92rem; margin: 0 auto 16px;">
          Enter your name below to instantly log in and access your personal profile details, your posts, and platform analytics.
        </p>
        <div style="display: flex; gap: 8px; justify-content: center; align-items: center; max-width: 420px; width: 100%; margin: 0 auto;">
          <input type="text" id="manage-inline-name-input" class="form-input" placeholder="Enter your name (e.g. Kumaran, Pavithra)..." style="background: var(--bg-surface); font-size: 0.95rem;">
          <button class="btn-primary" onclick="window.DiyaApp.submitInlineLogin()" style="white-space: nowrap; padding: 11px 22px;">
            Log In
          </button>
        </div>
        <div id="manage-inline-error-msg" style="display: none; color: var(--danger); font-size: 0.85rem; font-weight: 600; margin-top: 8px;"></div>
        <div style="margin-top: 18px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
            Or click a demo profile:
          </div>
          <div class="quick-login-chips" style="justify-content: center;">
            <button type="button" class="login-chip" onclick="window.DiyaApp.selectQuickLogin('Kumaran Iyengar')">Kumaran Iyengar</button>
            <button type="button" class="login-chip" onclick="window.DiyaApp.selectQuickLogin('Pavithra Nair')">Pavithra Nair</button>
            <button type="button" class="login-chip" onclick="window.DiyaApp.selectQuickLogin('Chirag Jadhav')">Chirag Jadhav</button>
            <button type="button" class="login-chip" onclick="window.DiyaApp.selectQuickLogin('Keerthana Swaminathan')">Keerthana Swaminathan</button>
          </div>
        </div>
      `;

      const inlineManageInput = document.getElementById('manage-inline-name-input');
      if (inlineManageInput) {
        inlineManageInput.onkeydown = (e) => {
          if (e.key === 'Enter') submitInlineLogin();
        };
      }
    }
  }

  // Profile Logout (Logs out of the entire user account)
  function logoutProfile() {
    state.isLoggedIn = false;
    state.isManageUnlocked = false;
    localStorage.setItem(LS_IS_LOGGED_IN, 'false');
    updateAuthUI();
    showToast('Logged out of your profile account.', 'info');
    window.DiyaApp.switchView('feed');
  }

  // Manage Center Logout / Lock (Locks Manage Center only; profile account remains logged in)
  function logoutManage() {
    state.isManageUnlocked = false;
    showToast('Manage Center locked. Your profile account remains logged in.', 'info');
    updateAuthUI();
  }

  // Manage Center Unlock
  function unlockManage() {
    state.isManageUnlocked = true;
    const user = getActiveProfile();
    showToast(`Manage Center unlocked for ${user.Name}!`, 'success');
    updateAuthUI();
  }

  function openManageUnlockModal() {
    unlockManage();
  }

  function submitManageUnlock() {
    closeModals();
  }



  // 11. Profile Details Modal
  function viewProfile(profileId) {
    if (!state.isLoggedIn) {
      showToast('Please log in with your name to view profile details!', 'error');
      openLoginModal('Please log in to view user profile details and activity');
      return;
    }

    const user = state.profilesMap.get(profileId);
    if (!user) return;

    const modal = document.getElementById('modal-profile-details');
    const body = document.getElementById('modal-profile-details-body');
    if (!modal || !body) return;

    const age = calculateAge(user.DOB);
    const userPosts = state.posts.filter(p => p.ProfileID === user.ProfileID);

    body.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div class="profile-card-avatar" style="background-color: ${user.AvatarBg || '#f97316'}; margin: 0 auto 12px; width: 72px; height: 72px; font-size: 1.4rem;">
          ${escapeHtml(user.Initials || 'U')}
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${escapeHtml(user.Name)}</h3>
        <div style="font-size: 0.85rem; color: var(--brand-secondary); font-weight: 600;">@${escapeHtml(user.Handle)}</div>
      </div>

      <div style="background: var(--bg-surface-secondary); padding: 14px 18px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem;">
        <div><strong>Profile ID:</strong> #${user.ProfileID}</div>
        <div><strong>Primary Email:</strong> ${escapeHtml(user.Email)}</div>
        ${user.AlternateEmail ? `<div><strong>Alternate Email:</strong> ${escapeHtml(user.AlternateEmail)}</div>` : ''}
        <div><strong>Date of Birth:</strong> ${formatDate(user.DOB)} ${age ? `(${age} years old)` : ''}</div>
        <div><strong>Total Published Posts:</strong> ${userPosts.length} posts</div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 14px;">
        <button class="btn-primary" style="flex: 1;" onclick="window.DiyaApp.filterByAuthor(${user.ProfileID})">
          View All ${userPosts.length} Posts
        </button>
        <button class="btn-secondary" style="flex: 1;" onclick="window.DiyaApp.closeModals()">
          Close
        </button>
      </div>
    `;

    modal.classList.add('open');
  }

  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  }

  // Switch Sub-tabs inside Manage Profiles (Profiles vs Analytics)
  function switchManageTab(tab) {
    const tabProfiles = document.getElementById('manage-tab-profiles');
    const tabAnalytics = document.getElementById('manage-tab-analytics');
    const btnProfiles = document.getElementById('tab-btn-profiles');
    const btnAnalytics = document.getElementById('tab-btn-analytics');

    if (tab === 'analytics') {
      if (tabProfiles) tabProfiles.style.display = 'none';
      if (tabAnalytics) tabAnalytics.style.display = 'flex';
      if (btnProfiles) btnProfiles.classList.remove('active');
      if (btnAnalytics) btnAnalytics.classList.add('active');
      renderAnalyticsOverview();
    } else {
      if (tabProfiles) tabProfiles.style.display = 'flex';
      if (tabAnalytics) tabAnalytics.style.display = 'none';
      if (btnProfiles) btnProfiles.classList.add('active');
      if (btnAnalytics) btnAnalytics.classList.remove('active');
      renderManageProfiles();
    }
  }

  // 12. Public API Window.DiyaApp
  window.DiyaApp = {
    // Navigation Views
    switchView: function (viewName) {

      if (viewName === 'my-posts') {
        if (!state.isLoggedIn) {
          showToast('Please log in with your name to view your profile and posts!', 'error');
          openLoginModal('Log in to view your profile and your posts');
          return;
        }
        this.showMyPosts();
        return;
      }

      let targetViewId = viewName;
      if (viewName === 'analytics') {
        targetViewId = 'manage-profiles';
        switchManageTab('analytics');
      } else if (viewName === 'manage-profiles') {
        switchManageTab('profiles');
      }

      state.currentView = viewName;

      // Update Nav active classes
      document.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
      });

      // Show/Hide sections
      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
      const activeSec = document.getElementById(`view-${targetViewId}`);
      if (activeSec) activeSec.classList.add('active');

      if (viewName === 'feed') renderFeed();
      if (viewName === 'manage-profiles') renderManageProfiles();

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Sub-tab switcher inside Manage Profiles
    switchManageTab: switchManageTab,

    // Show My Posts
    showMyPosts: function () {
      state.currentView = 'feed';
      state.currentFilter = 'my-posts';

      document.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === 'my-posts');
      });

      document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-filter') === 'my-posts');
      });

      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
      const feedSec = document.getElementById('view-feed');
      if (feedSec) feedSec.classList.add('active');

      renderFeed(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Login Modal & Selectors
    openLoginModal: openLoginModal,
    submitLoginWithName: submitLoginWithName,
    submitInlineLogin: submitInlineLogin,
    selectQuickLogin: function (name) {
      const input = document.getElementById('login-name-input');
      if (input) input.value = name;
      submitLoginWithName(name);
    },
    // Logouts & Unlocks
    unlockManage: unlockManage,
    logoutProfile: logoutProfile,
    logoutManage: logoutManage,
    logout: logoutProfile, // alias
    openManageUnlockModal: openManageUnlockModal,

    // Reactions
    toggleReaction: toggleReaction,

    // Engagements
    toggleEngagementDrawer: toggleEngagementDrawer,
    submitTextEngagement: submitTextEngagement,
    submitButtonEngagement: submitButtonEngagement,

    // Modals
    viewProfile: viewProfile,
    closeModals: closeModals,

    // Filtering & Search
    filterByTag: function (tag) {
      state.currentView = 'feed';
      state.currentFilter = 'all';
      this.switchView('feed');
      const searchInput = document.getElementById('global-search');
      if (searchInput) {
        searchInput.value = `#${tag}`;
        document.getElementById('search-clear-btn').style.display = 'flex';
      }
      state.searchQuery = `#${tag}`;
      renderFeed(true);
    },

    filterByAuthor: function (profileId) {
      closeModals();
      state.currentView = 'feed';
      state.currentFilter = 'all';
      this.switchView('feed');
      const author = state.profilesMap.get(profileId);
      if (author) {
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
          searchInput.value = author.Name;
          document.getElementById('search-clear-btn').style.display = 'flex';
        }
        state.searchQuery = author.Name;
        renderFeed(true);
      }
    }
  };

  // 13. DOM Event Listeners Setup
  document.addEventListener('DOMContentLoaded', () => {
    initData();

    // Navigation Buttons
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (view) window.DiyaApp.switchView(view);
      });
    });

    // Login Triggers
    document.getElementById('btn-header-login')?.addEventListener('click', () => openLoginModal());
    document.getElementById('btn-submit-login')?.addEventListener('click', submitLoginWithName);
    // Profile Logout Trigger (Header)
    document.getElementById('btn-header-logout')?.addEventListener('click', logoutProfile);

    // Manage Triggers (Top Button next to Logout)
    document.getElementById('btn-header-manage')?.addEventListener('click', () => {
      if (!state.isLoggedIn) {
        state.pendingManageOpen = true;
        openLoginModal('Please enter your name to log in and access Manage');
      } else {
        window.DiyaApp.switchView('manage-profiles');
      }
    });

    // Inline Manage Input Enter key
    const inlineManageInput = document.getElementById('manage-inline-name-input');
    if (inlineManageInput) {
      inlineManageInput.onkeydown = (e) => {
        if (e.key === 'Enter') submitInlineLogin();
      };
    }

    // User Profile Pill in header
    document.getElementById('btn-active-user-pill')?.addEventListener('click', () => {
      if (state.isLoggedIn) {
        viewProfile(state.activeProfileId);
      } else {
        openLoginModal();
      }
    });

    // Global Search Input
    const searchInput = document.getElementById('global-search');
    const clearSearchBtn = document.getElementById('search-clear-btn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = state.searchQuery ? 'flex' : 'none';
        }
        if (state.currentView !== 'feed') {
          window.DiyaApp.switchView('feed');
        } else {
          renderFeed(true);
        }
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderFeed(true);
      });
    }

    // Feed Filter Pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.getAttribute('data-filter') || 'all';

        // If clicking My Posts while not logged in, prompt login
        if (state.currentFilter === 'my-posts' && !state.isLoggedIn) {
          openLoginModal('Please log in to view your posts');
          return;
        }

        renderFeed(true);
      });
    });

    // Feed Sort Select
    document.getElementById('feed-sort-select')?.addEventListener('change', (e) => {
      state.currentSort = e.target.value;
      renderFeed(true);
    });

    // Load More Button
    document.getElementById('btn-load-more')?.addEventListener('click', () => {
      state.page += 1;
      renderFeed(false);
    });

    // Quick Compose Box
    const btnToggleMedia = document.getElementById('btn-toggle-media-input');
    const composeMediaBox = document.getElementById('compose-media-box');
    if (btnToggleMedia && composeMediaBox) {
      btnToggleMedia.addEventListener('click', () => {
        const isHidden = composeMediaBox.style.display === 'none';
        composeMediaBox.style.display = isHidden ? 'block' : 'none';
        btnToggleMedia.classList.toggle('active', isHidden);
      });
    }

    const btnSubmitQuickPost = document.getElementById('btn-submit-quick-post');
    if (btnSubmitQuickPost) {
      btnSubmitQuickPost.addEventListener('click', () => {
        const text = document.getElementById('quick-post-text').value;
        const mediaUrl = document.getElementById('quick-post-media-url')?.value;
        const status = document.getElementById('quick-post-status')?.value || 'Published';

        if (createNewPost(text, mediaUrl, status)) {
          document.getElementById('quick-post-text').value = '';
          if (document.getElementById('quick-post-media-url')) {
            document.getElementById('quick-post-media-url').value = '';
          }
          if (composeMediaBox) composeMediaBox.style.display = 'none';
        }
      });
    }

    // Modal Create Post
    const btnHeaderNewPost = document.getElementById('btn-header-new-post');
    const modalCreatePost = document.getElementById('modal-create-post');
    if (btnHeaderNewPost && modalCreatePost) {
      btnHeaderNewPost.addEventListener('click', () => {
        if (!state.isLoggedIn) {
          openLoginModal('Please log in before publishing a new buzz');
          return;
        }
        document.getElementById('modal-post-text').value = '';
        document.getElementById('modal-post-media').value = '';
        modalCreatePost.classList.add('open');
      });
    }

    document.getElementById('btn-modal-submit-post')?.addEventListener('click', () => {
      const text = document.getElementById('modal-post-text').value;
      const media = document.getElementById('modal-post-media').value;
      const status = document.getElementById('modal-post-status').value;

      if (createNewPost(text, media, status)) {
        closeModals();
      }
    });

    // Refresh Suggested Creators
    document.getElementById('btn-refresh-suggested')?.addEventListener('click', () => {
      renderSuggestedProfiles();
      showToast('Refreshed suggested creators', 'info');
    });

    // Directory Search Input
    document.getElementById('directory-search')?.addEventListener('input', () => {
      renderManageProfiles();
    });

    // Close Modals on click outside dialog
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModals();
      });
    });

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModals();
    });
  });
})();
