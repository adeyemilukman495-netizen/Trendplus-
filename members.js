(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const feedback = message => { $('feedback').textContent = message || ''; };
  const safe = value => String(value ?? '');
  const card = (title, body) => {
    const article = document.createElement('article');
    article.className = 'card';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = body;
    article.append(heading, paragraph);
    return article;
  };
  const backend = window.TPBackend;

  if (!backend || !backend.ready) {
    $('backend-status').textContent = 'Backend source is prepared. To activate accounts and shared features, create a Supabase project, run supabase/schema.sql, and add the project URL and publishable key to supabase-config.js.';
    $('backend-status').className = 'notice';
    return;
  }

  $('backend-status').textContent = 'Secure backend configured. Sign in or create your account.';
  const run = async action => {
    try { await action(); }
    catch (error) { feedback(error.message || 'Something went wrong. Please try again.'); }
  };

  async function loadFeed() {
    const posts = await backend.getPosts();
    const root = $('feed');
    root.replaceChildren();
    posts.forEach(post => {
      const item = card(post.profiles?.display_name || 'TrendPulse member', post.content);
      const meta = document.createElement('small');
      meta.className = 'muted';
      meta.textContent = post.category + ' · ' + new Date(post.created_at).toLocaleString();
      const like = document.createElement('button');
      like.className = 'secondary';
      like.textContent = '♥ Like';
      like.onclick = () => run(async () => {
        const liked = await backend.toggleLike(post.id);
        like.textContent = liked ? '♥ Liked' : '♥ Like';
        feedback('Your like was saved.');
      });
      const commentForm = document.createElement('form');
      commentForm.className = 'row';
      const input = document.createElement('input');
      input.required = true;
      input.maxLength = 1000;
      input.placeholder = 'Add a comment';
      const button = document.createElement('button');
      button.className = 'primary';
      button.textContent = 'Comment';
      commentForm.append(input, button);
      commentForm.onsubmit = event => {
        event.preventDefault();
        run(async () => {
          await backend.addComment(post.id, input.value);
          input.value = '';
          feedback('Comment added.');
        });
      };
      item.append(meta, like, commentForm);
      root.append(item);
    });
    if (!posts.length) root.append(card('No posts yet', 'Be the first to start a conversation.'));
  }

  async function loadWatchlist() {
    const items = await backend.getWatchlist();
    const root = $('watchlist');
    root.replaceChildren();
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'card';
      const name = document.createElement('b');
      name.textContent = item.title + ' · ' + item.media_type;
      const select = document.createElement('select');
      ['Plan to watch', 'Watching', 'Completed', 'On hold', 'Dropped'].forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        option.selected = item.status === status;
        select.append(option);
      });
      select.onchange = () => run(async () => {
        await backend.updateWatchStatus(item.id, select.value);
        feedback('Watch status updated.');
      });
      const remove = document.createElement('button');
      remove.className = 'secondary';
      remove.textContent = 'Remove';
      remove.onclick = () => run(async () => {
        await backend.removeWatchlist(item.id);
        await loadWatchlist();
      });
      row.append(name, select, remove);
      root.append(row);
    });
    if (!items.length) root.append(card('Your watchlist is empty', 'Add a title above.'));
  }

  async function loadReviews() {
    const reviews = await backend.getReviews();
    const root = $('reviews');
    root.replaceChildren();
    reviews.forEach(review => root.append(card(
      review.title + ' · ' + '★'.repeat(review.rating),
      (review.profiles?.display_name || 'Member') + ': ' + review.content + (review.contains_spoilers ? ' · Spoilers marked' : '')
    )));
  }

  async function loadClubs() {
    const clubs = await backend.getClubs();
    const root = $('clubs');
    root.replaceChildren();
    clubs.forEach(club => {
      const item = card(club.name, club.category + ' · ' + club.description);
      const join = document.createElement('button');
      join.className = 'secondary';
      join.textContent = 'Join club';
      join.onclick = () => run(async () => {
        await backend.joinClub(club.id);
        feedback('You joined ' + club.name + '.');
      });
      item.append(join);
      root.append(item);
    });
  }

  async function refresh() {
    await Promise.all([loadFeed(), loadWatchlist(), loadReviews(), loadClubs()]);
  }

  async function signedIn(user) {
    if (!user) {
      $('auth-panel').hidden = false;
      $('member-panel').hidden = true;
      $('member-email').textContent = '';
      return;
    }
    $('auth-panel').hidden = true;
    $('member-panel').hidden = false;
    $('member-email').textContent = user.email || 'Signed in';
    await run(async () => {
      const profile = await backend.getProfile(user.id);
      $('profile-display').value = profile.display_name || '';
      $('profile-username').value = profile.username || '';
      $('profile-bio').value = profile.bio || '';
      await refresh();
    });
  }

  $('signup-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      const result = await backend.signUp(
        $('signup-email').value.trim(),
        $('signup-password').value,
        $('signup-name').value.trim()
      );
      if (result.error) throw result.error;
      feedback('Account created. Check your email if confirmation is enabled, then sign in.');
    });
  };
  $('google-signin').onclick = () => run(async () => {
    feedback('Redirecting to Google…');
    const result = await backend.signInWithGoogle();
    if (result.error) throw result.error;
  });
  $('signin-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      const result = await backend.signIn($('signin-email').value.trim(), $('signin-password').value);
      if (result.error) throw result.error;
      await signedIn(result.data.user);
      feedback('Signed in successfully.');
    });
  };
  $('signout').onclick = () => run(async () => {
    const result = await backend.signOut();
    if (result.error) throw result.error;
    await signedIn(null);
    feedback('You are signed out.');
  });
  $('profile-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      await backend.saveProfile({
        display_name: $('profile-display').value,
        username: $('profile-username').value,
        bio: $('profile-bio').value,
      });
      feedback('Profile saved.');
    });
  };
  $('post-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      await backend.createPost({
        category: $('post-category').value,
        content: $('post-content').value,
      });
      $('post-content').value = '';
      await loadFeed();
      feedback('Post published to the shared community.');
    });
  };
  $('watch-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      await backend.addWatchlist({
        title: $('watch-title').value,
        media_type: $('watch-type').value,
      });
      $('watch-title').value = '';
      await loadWatchlist();
      feedback('Added to your watchlist.');
    });
  };
  $('review-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      await backend.createReview({
        title: $('review-title').value,
        media_type: $('review-type').value,
        rating: $('review-rating').value,
        content: $('review-content').value,
        contains_spoilers: $('review-spoilers').checked,
      });
      $('review-form').reset();
      await loadReviews();
      feedback('Review published.');
    });
  };
  $('member-search-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      const users = await backend.searchMembers($('member-search').value);
      const root = $('member-results');
      root.replaceChildren();
      users.forEach(member => {
        const item = card(member.display_name, '@' + (member.username || 'member') + ' · ' + member.bio);
        const follow = document.createElement('button');
        follow.className = 'secondary';
        follow.textContent = 'Follow';
        follow.onclick = () => run(async () => {
          await backend.followUser(member.id);
          feedback('You are now following ' + member.display_name + '.');
        });
        const start = document.createElement('button');
        start.className = 'primary';
        start.textContent = 'Message';
        start.onclick = () => run(async () => {
          const conversation = await backend.startConversation(member.id);
          $('chat-area').hidden = false;
          $('chat-title').textContent = 'Chat with ' + member.display_name;
          $('chat-area').dataset.conversationId = conversation.id;
          await loadMessages(conversation.id);
        });
        item.append(follow, start);
        root.append(item);
      });
      if (!users.length) root.append(card('No members found', 'Try another username or display name.'));
    });
  };
  async function loadMessages(conversationId) {
    const messages = await backend.getMessages(conversationId);
    const root = $('chat-messages');
    root.replaceChildren();
    messages.forEach(message => root.append(card(
      message.sender_id === window.currentTrendPulseUserId ? 'You' : 'Member',
      message.body
    )));
  }
  $('message-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      const id = $('chat-area').dataset.conversationId;
      if (!id) throw new Error('Choose a member first.');
      await backend.sendMessage(id, $('message-content').value);
      $('message-content').value = '';
      await loadMessages(id);
    });
  };
  $('club-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      await backend.createClub({
        name: $('club-name').value,
        category: $('club-topic').value,
        description: $('club-description').value,
      });
      $('club-form').reset();
      await loadClubs();
      feedback('Fan club created.');
    });
  };
  $('media-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      const file = $('media-file').files[0];
      if (!file) throw new Error('Choose a file first.');
      const url = await backend.uploadMedia(file);
      $('media-result').textContent = 'Upload complete: ' + url;
      feedback('Media uploaded.');
    });
  };
  $('short-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      await backend.createShort({
        title: $('short-title').value,
        caption: $('short-caption').value,
        video_url: $('short-url').value,
      });
      $('short-form').reset();
      feedback('Short link published.');
    });
  };
  $('report-form').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      await backend.reportContent({
        target_type: $('report-type').value,
        target_id: $('report-id').value,
        reason: $('report-reason').value,
      });
      $('report-form').reset();
      feedback('Report submitted for moderation review.');
    });
  };

  backend.onAuthChange(user => {
    window.currentTrendPulseUserId = user?.id || null;
    run(() => signedIn(user));
  });
  run(async () => {
    const user = await backend.currentUser();
    window.currentTrendPulseUserId = user?.id || null;
    await signedIn(user);
  });
})();
