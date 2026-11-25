/* TrendPulse Supabase client bridge.
 * Loads after the Supabase v2 browser bundle and supabase-config.js.
 * The publishable key is designed for browser use; database RLS is the security boundary.
 */
(function () {
  'use strict';

  const configured = Boolean(
    window.TRENDPULSE_SUPABASE_URL &&
    window.TRENDPULSE_SUPABASE_PUBLISHABLE_KEY
  );

  if (!configured || !window.supabase) {
    window.TPBackend = {
      ready: false,
      reason: 'Add your Supabase project URL and publishable key to supabase-config.js.',
    };
    return;
  }

  const client = window.supabase.createClient(
    window.TRENDPULSE_SUPABASE_URL,
    window.TRENDPULSE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 8 },
      },
    }
  );

  const currentUser = async () => {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user;
  };

  const requireUser = async () => {
    const user = await currentUser();
    if (!user) throw new Error('Please sign in first.');
    return user;
  };

  window.TPBackend = {
    ready: true,
    client,
    currentUser,
    signUp: async (email, password, displayName) =>
      client.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      }),
    signIn: (email, password) =>
      client.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Always return OAuth users to the published GitHub Pages site.
        // This prevents a local preview hostname (localhost) becoming the callback.
        redirectTo: 'https://adeyemilukman495-netizen.github.io/Trendplus-/profile.html',
      },
    }),
    signOut: () => client.auth.signOut(),
    onAuthChange: callback =>
      client.auth.onAuthStateChange((_event, session) => callback(session?.user || null)),

    getProfile: async userId => {
      const id = userId || (await requireUser()).id;
      const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    saveProfile: async values => {
      const user = await requireUser();
      const payload = {
        id: user.id,
        display_name: String(values.display_name || '').trim().slice(0, 40),
        username: String(values.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || null,
        bio: String(values.bio || '').trim().slice(0, 240),
        updated_at: new Date().toISOString(),
      };
      if (!payload.display_name) throw new Error('Display name is required.');
      const { data, error } = await client.from('profiles').upsert(payload).select().single();
      if (error) throw error;
      return data;
    },

    getPosts: async () => {
      const { data, error } = await client
        .from('posts')
        .select('*, profiles!posts_author_id_fkey(display_name, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    createPost: async values => {
      const user = await requireUser();
      const { data, error } = await client.from('posts').insert({
        author_id: user.id,
        category: values.category || 'General',
        content: String(values.content || '').trim().slice(0, 2000),
        media_url: values.media_url || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    getComments: async postId => {
      const { data, error } = await client
        .from('comments')
        .select('*, profiles!comments_author_id_fkey(display_name, username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    addComment: async (postId, content) => {
      const user = await requireUser();
      const { data, error } = await client.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        content: String(content || '').trim().slice(0, 1000),
      }).select().single();
      if (error) throw error;
      return data;
    },
    toggleLike: async postId => {
      const user = await requireUser();
      const { data: existing, error: readError } = await client
        .from('post_likes').select('post_id')
        .eq('post_id', postId).eq('user_id', user.id).maybeSingle();
      if (readError) throw readError;
      if (existing) {
        const { error } = await client.from('post_likes').delete()
          .eq('post_id', postId).eq('user_id', user.id);
        if (error) throw error;
        return false;
      }
      const { error } = await client.from('post_likes').insert({ post_id: postId, user_id: user.id });
      if (error) throw error;
      return true;
    },

    getWatchlist: async () => {
      const user = await requireUser();
      const { data, error } = await client.from('watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    addWatchlist: async values => {
      const user = await requireUser();
      const { data, error } = await client.from('watchlist').insert({
        user_id: user.id,
        external_id: values.external_id || null,
        title: String(values.title || '').trim().slice(0, 160),
        media_type: values.media_type || 'Other',
        poster_url: values.poster_url || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    updateWatchStatus: async (id, status) => {
      const user = await requireUser();
      const { data, error } = await client.from('watchlist').update({ status }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      return data;
    },
    removeWatchlist: async id => {
      const user = await requireUser();
      const { error } = await client.from('watchlist').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },

    createReview: async values => {
      const user = await requireUser();
      const { data, error } = await client.from('reviews').insert({
        author_id: user.id,
        external_id: values.external_id || null,
        title: String(values.title || '').trim().slice(0, 160),
        media_type: values.media_type || 'Other',
        rating: Number(values.rating),
        content: String(values.content || '').trim().slice(0, 3000),
        contains_spoilers: Boolean(values.contains_spoilers),
      }).select().single();
      if (error) throw error;
      return data;
    },
    getReviews: async title => {
      let query = client.from('reviews').select('*, profiles!reviews_author_id_fkey(display_name, username)').order('created_at', { ascending: false }).limit(50);
      if (title) query = query.ilike('title', '%' + title + '%');
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    startConversation: async otherUserId => {
      const user = await requireUser();
      if (!otherUserId || otherUserId === user.id) throw new Error('Choose another member.');
      const { data: conversationId, error } = await client.rpc('start_conversation', {
        other_user: otherUserId,
      });
      if (error) throw error;
      const { data, error: readError } = await client.from('conversations')
        .select('*').eq('id', conversationId).single();
      if (readError) throw readError;
      return data;
    },
    getConversations: async () => {
      const user = await requireUser();
      const { data, error } = await client.from('conversation_members')
        .select('conversation_id, conversations(id, created_at, updated_at)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    getMessages: async conversationId => {
      const { data, error } = await client.from('messages').select('*')
        .eq('conversation_id', conversationId).order('created_at').limit(100);
      if (error) throw error;
      return data;
    },
    sendMessage: async (conversationId, body) => {
      const user = await requireUser();
      const { data, error } = await client.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: String(body || '').trim().slice(0, 4000),
      }).select().single();
      if (error) throw error;
      await client.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
      return data;
    },
    markMessageRead: async messageId => {
      const { data, error } = await client.rpc('mark_message_read', { message_uuid: messageId });
      if (error) throw error;
      return data;
    },
    joinConversationRealtime: async (conversationId, handlers = {}) => {
      const user = await requireUser();
      const channel = client.channel('conversation:' + conversationId, {
        config: { private: true, presence: { key: user.id } },
      });
      if (handlers.onPresence) {
        channel.on('presence', { event: 'sync' }, () => {
          handlers.onPresence(channel.presenceState());
        });
      }
      if (handlers.onTyping) {
        channel.on('broadcast', { event: 'typing' }, payload => {
          if (payload.payload?.user_id !== user.id) handlers.onTyping(payload.payload);
        });
      }
      if (handlers.onMessage) {
        channel.on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'conversation_id=eq.' + conversationId,
        }, payload => handlers.onMessage(payload.new));
      }
      const status = await new Promise(resolve => {
        channel.subscribe(async state => {
          if (state === 'SUBSCRIBED') {
            await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
            resolve(state);
          } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
            resolve(state);
          }
        });
      });
      return { channel, status };
    },
    sendTyping: async (channel, isTyping) => {
      const user = await requireUser();
      return channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, typing: Boolean(isTyping) },
      });
    },
    leaveRealtime: channel => client.removeChannel(channel),
    subscribeToFeed: callback =>
      client.channel('trendpulse-public-feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
        .subscribe(),
    subscribeToConversation: (conversationId, callback) =>
      client.channel('trendpulse-conversation-' + conversationId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'conversation_id=eq.' + conversationId,
        }, callback)
        .subscribe(),
    removeChannel: channel => client.removeChannel(channel),

    uploadMedia: async file => {
      const user = await requireUser();
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
      if (!allowed.includes(file.type)) throw new Error('This file type is not supported.');
      if (file.size > 50 * 1024 * 1024) throw new Error('Choose a file smaller than 50 MB.');
      const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
      const path = user.id + '/' + crypto.randomUUID() + '.' + extension;
      const { error } = await client.storage.from('trendpulse-media').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = client.storage.from('trendpulse-media').getPublicUrl(path);
      return data.publicUrl;
    },

    getShortComments: async shortId => {
      const { data, error } = await client.from('short_comments')
        .select('*, profiles!short_comments_author_id_fkey(display_name, username, avatar_url)')
        .eq('short_id', shortId).order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    addShortComment: async (shortId, content) => {
      const user = await requireUser();
      const body = String(content || '').trim().slice(0, 1000);
      if (!body) throw new Error('Write a comment first.');
      const { data, error } = await client.from('short_comments')
        .insert({ short_id: shortId, author_id: user.id, content: body }).select().single();
      if (error) throw error;
      return data;
    },
    toggleShortLike: async shortId => {
      const user = await requireUser();
      const { data: existing, error: readError } = await client.from('short_likes')
        .select('short_id').eq('short_id', shortId).eq('user_id', user.id).maybeSingle();
      if (readError) throw readError;
      if (existing) {
        const { error } = await client.from('short_likes').delete()
          .eq('short_id', shortId).eq('user_id', user.id);
        if (error) throw error;
        return false;
      }
      const { error } = await client.from('short_likes').insert({ short_id: shortId, user_id: user.id });
      if (error) throw error;
      return true;
    },
    updateShortSettings: async (shortId, visibility, allowComments, allowDownload) => {
      const user = await requireUser();
      const { data, error } = await client.from('shorts').update({
        visibility, allow_comments: !!allowComments, allow_download: !!allowDownload
      }).eq('id', shortId).eq('author_id', user.id).select().single();
      if (error) throw error;
      return data;
    },
    getShorts: async () => {
      const user = await currentUser();
      const { data, error } = await client.from('shorts')
        .select('*, profiles!shorts_author_id_fkey(display_name, username), short_likes(count)')
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      let liked = new Set();
      if (user && data.length) {
        const { data: mine, error: likeError } = await client.from('short_likes')
          .select('short_id').eq('user_id', user.id).in('short_id', data.map(x => x.id));
        if (likeError) throw likeError;
        liked = new Set(mine.map(x => x.short_id));
      }
      return data.map(x => ({ ...x, like_count: x.short_likes?.[0]?.count || 0, liked_by_me: liked.has(x.id) }));
    },
    createShort: async values => {
      const user = await requireUser();
      const { data, error } = await client.from('shorts').insert({
        author_id: user.id,
        title: String(values.title || '').trim().slice(0, 100),
        caption: String(values.caption || '').trim().slice(0, 280),
        category: values.category || 'General',
        video_url: values.video_url,
        thumbnail_url: values.thumbnail_url || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    getClubs: async () => {
      const { data, error } = await client.from('fan_clubs').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    joinClub: async clubId => {
      const user = await requireUser();
      const { error } = await client.from('fan_club_members').insert({ club_id: clubId, user_id: user.id });
      if (error && error.code !== '23505') throw error;
    },
    castBattleVote: async (battleId, choice) => {
      const user = await requireUser();
      const { error } = await client.from('battle_votes').insert({ battle_id: battleId, user_id: user.id, choice });
      if (error) throw error;
    },
    reportContent: async values => {
      const user = await requireUser();
      const { error } = await client.from('reports').insert({
        reporter_id: user.id,
        target_type: values.target_type,
        target_id: values.target_id,
        reason: String(values.reason || '').trim().slice(0, 1000),
      });
      if (error) throw error;
    },
    searchMembers: async term => {
      const q = String(term || '').trim();
      if (q.length < 2) return [];
      const user = await requireUser();
      const { data, error } = await client.from('profiles')
        .select('id, username, display_name, bio, avatar_url')
        .or('username.ilike.%' + q + '%,display_name.ilike.%' + q + '%')
        .neq('id', user.id)
        .limit(20);
      if (error) throw error;
      return data;
    },
    followUser: async followedId => {
      const user = await requireUser();
      const { error } = await client.from('follows').insert({ follower_id: user.id, followed_id: followedId });
      if (error && error.code !== '23505') throw error;
    },
    unfollowUser: async followedId => {
      const user = await requireUser();
      const { error } = await client.from('follows').delete().eq('follower_id', user.id).eq('followed_id', followedId);
      if (error) throw error;
    },
    createClub: async values => {
      const user = await requireUser();
      const name = String(values.name || '').trim().slice(0, 70);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + user.id.slice(0, 6);
      const { data, error } = await client.from('fan_clubs').insert({
        created_by: user.id,
        name,
        slug,
        description: String(values.description || '').trim().slice(0, 500),
        category: values.category || 'General',
      }).select().single();
      if (error) throw error;
      const { error: memberError } = await client.from('fan_club_members').insert({
        club_id: data.id, user_id: user.id, role: 'owner',
      });
      if (memberError) throw memberError;
      return data;
    },
    getBattles: async () => {
      const { data, error } = await client.from('battles').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    createBattle: async values => {
      const user = await requireUser();
      const { data, error } = await client.from('battles').insert({
        created_by: user.id,
        title: String(values.title || '').trim().slice(0, 100),
        left_title: String(values.left_title || '').trim().slice(0, 100),
        right_title: String(values.right_title || '').trim().slice(0, 100),
        category: values.category || 'General',
      }).select().single();
      if (error) throw error;
      return data;
    },
    getStories: async () => {
      const { data, error } = await client.from('stories')
        .select('*, profiles!stories_author_id_fkey(display_name, username)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    createStory: async values => {
      const user = await requireUser();
      const { data, error } = await client.from('stories').insert({
        author_id: user.id,
        media_url: values.media_url,
        caption: String(values.caption || '').trim().slice(0, 240),
      }).select().single();
      if (error) throw error;
      return data;
    },
    getNotifications: async () => {
      const user = await requireUser();
      const { data, error } = await client.from('notifications').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    markNotificationRead: async id => {
      const user = await requireUser();
      const { error } = await client.from('notifications').update({ is_read: true })
        .eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    blockUser: async blockedId => {
      const user = await requireUser();
      const { error } = await client.from('blocks').insert({ blocker_id: user.id, blocked_id: blockedId });
      if (error && error.code !== '23505') throw error;
    },
    unblockUser: async blockedId => {
      const user = await requireUser();
      const { error } = await client.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId);
      if (error) throw error;
    },
  };
})();
