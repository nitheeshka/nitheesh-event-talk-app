/**
 * BigQuery Release Pulse - Client App (Vanilla JS)
 */

document.addEventListener('DOMContentLoaded', () => {
    // App State
    let allUpdates = [];
    let filteredUpdates = [];
    let selectedUpdate = null;
    let currentFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshSpinner = document.getElementById('refresh-spinner');
    const retryBtn = document.getElementById('retry-btn');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    const feedContainer = document.getElementById('feed-container');
    const feedStatus = document.getElementById('feed-status');
    const errorStatus = document.getElementById('error-status');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    
    // Composer Elements
    const composerSidebar = document.querySelector('.composer-sidebar');
    const composerEmptyState = document.getElementById('composer-empty-state');
    const composerActiveState = document.getElementById('composer-active-state');
    const composerTypeBadge = document.getElementById('composer-type-badge');
    const composerDateDisplay = document.getElementById('composer-date-display');
    const composerSourceText = document.getElementById('composer-source-text');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const tweetCounter = document.getElementById('tweet-counter');
    const tweetPreviewText = document.getElementById('x-tweet-preview-text');
    const tweetBtn = document.getElementById('tweet-btn');
    const closeComposerBtn = document.getElementById('close-composer');
    const selectFirstShortcut = document.getElementById('select-first-shortcut');

    // Fetch Release Notes
    async function fetchReleaseNotes() {
        showLoadingState();
        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Server returned an error');
            }
            
            processFeedEntries(data.entries);
            renderFeed();
            
            // If we have updates, show shortcut to select the first one in composer empty state
            if (allUpdates.length > 0) {
                selectFirstShortcut.style.display = 'inline-flex';
            }
            
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showErrorState(error.message);
        }
    }

    // Process Raw Atom Feed Entries
    function processFeedEntries(entries) {
        allUpdates = [];
        
        entries.forEach(entry => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(entry.content, 'text/html');
            const h3s = doc.querySelectorAll('h3');
            
            const date = entry.title; // e.g. "June 16, 2026"
            const rawDate = entry.updated;
            const link = entry.link || 'https://cloud.google.com/bigquery/docs/release-notes';
            
            if (h3s.length === 0) {
                // If there's no h3, treat the whole content as one general update
                allUpdates.push({
                    id: entry.id + '-general',
                    date: date,
                    rawDate: rawDate,
                    type: 'General',
                    normalizedType: 'general',
                    contentHtml: entry.content,
                    contentText: cleanTextContent(doc.body.textContent),
                    link: link
                });
            } else {
                // Split updates by <h3> headers
                h3s.forEach((h3, index) => {
                    const type = h3.textContent.trim();
                    const normalizedType = normalizeUpdateType(type);
                    
                    let contentHtml = '';
                    let contentText = '';
                    
                    let sibling = h3.nextElementSibling;
                    while (sibling && sibling.tagName !== 'H3') {
                        contentHtml += sibling.outerHTML;
                        contentText += sibling.textContent + ' ';
                        sibling = sibling.nextElementSibling;
                    }
                    
                    allUpdates.push({
                        id: `${entry.id}-${index}`,
                        date: date,
                        rawDate: rawDate,
                        type: type,
                        normalizedType: normalizedType,
                        contentHtml: contentHtml,
                        contentText: cleanTextContent(contentText),
                        link: link
                    });
                });
            }
        });
        
        filteredUpdates = [...allUpdates];
    }

    // Normalizes GCP update types to fit filters
    function normalizeUpdateType(type) {
        const lower = type.toLowerCase();
        if (lower.startsWith('feature')) return 'feature';
        if (lower.startsWith('announcement')) return 'announcement';
        if (lower.startsWith('deprecated') || lower.startsWith('deprecation') || lower.startsWith('breaking')) {
            return 'deprecation';
        }
        return 'general';
    }

    // Cleans up whitespaces, newlines, and extra text
    function cleanTextContent(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .trim();
    }

    // Render Feed Cards
    function renderFeed() {
        // Hide loading
        feedStatus.style.display = 'none';
        errorStatus.style.display = 'none';
        
        // Apply search and tab filter
        filteredUpdates = allUpdates.filter(update => {
            const matchesTab = currentFilter === 'all' || update.normalizedType === currentFilter;
            const matchesSearch = searchQuery === '' || 
                update.date.toLowerCase().includes(searchQuery) ||
                update.type.toLowerCase().includes(searchQuery) ||
                update.contentText.toLowerCase().includes(searchQuery);
            return matchesTab && matchesSearch;
        });

        // Clear container
        feedContainer.innerHTML = '';

        if (filteredUpdates.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        // Render card elements
        filteredUpdates.forEach((update, idx) => {
            const card = document.createElement('div');
            card.className = `note-card glass-card card-${update.normalizedType} slide-in`;
            card.style.animationDelay = `${idx * 0.05}s`;
            card.dataset.id = update.id;
            
            if (selectedUpdate && selectedUpdate.id === update.id) {
                card.classList.add('selected');
            }

            // Type Badge color mapping
            let badgeClass = `badge-${update.normalizedType}`;
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-meta">
                        <span class="badge ${badgeClass}">${update.type}</span>
                        <span class="card-date"><i class="fa-regular fa-calendar-days"></i> ${update.date}</span>
                    </div>
                    <div class="card-actions">
                        <button class="card-action-btn copy-card-btn" title="Copy to Clipboard" data-id="${update.id}">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                        <span class="card-select-hint">
                            <i class="fa-brands fa-x-twitter"></i> Select to Tweet
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    ${update.contentHtml}
                </div>
            `;

            // Copy click listener
            const copyBtn = card.querySelector('.copy-card-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent trigger card selection
                copyUpdateToClipboard(update, copyBtn);
            });

            // Click listener
            card.addEventListener('click', () => {
                selectUpdate(update);
            });

            feedContainer.appendChild(card);
        });
    }

    // Select specific update to tweet
    function selectUpdate(update) {
        selectedUpdate = update;
        
        // Highlight active card
        document.querySelectorAll('.note-card').forEach(card => {
            if (card.dataset.id === update.id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Activate composer UI
        composerEmptyState.style.display = 'none';
        composerActiveState.style.display = 'flex';
        composerSidebar.classList.add('active'); // active drawer on mobile

        // Populate composer metadata
        composerTypeBadge.textContent = update.type;
        composerTypeBadge.className = `badge badge-${update.normalizedType}`;
        composerDateDisplay.textContent = update.date;
        composerSourceText.textContent = update.contentText;
        
        // Auto-draft tweet text
        const autoTweetText = generateAutoTweet(update);
        tweetTextarea.value = autoTweetText;
        
        // Update character counts and preview
        updateTweetMetrics();
    }

    // Generate Twitter-friendly content text
    function generateAutoTweet(update) {
        const header = `📢 BigQuery Release Note (${update.date})\n⚡ ${update.type}: `;
        const link = update.link;
        const hashtags = `\n\nRead more: ${link} #BigQuery #GCP`;
        
        const maxTextLen = 280 - header.length - hashtags.length;
        let bodyText = update.contentText;

        if (bodyText.length > maxTextLen) {
            // Cut off carefully
            let truncated = bodyText.slice(0, maxTextLen - 3);
            const lastSpace = truncated.lastIndexOf(' ');
            // Truncate at space if it's within a reasonable range, else keep standard truncation
            if (lastSpace > maxTextLen * 0.7) {
                truncated = truncated.slice(0, lastSpace);
            }
            bodyText = truncated + '...';
        }

        return `${header}${bodyText}${hashtags}`;
    }

    // Update Tweet count and live rendering card
    function updateTweetMetrics() {
        const text = tweetTextarea.value;
        const length = text.length;
        
        tweetCounter.textContent = `${length} / 280`;
        
        // Color coding for length warning
        if (length > 280) {
            tweetCounter.className = 'tweet-counter danger';
            tweetBtn.disabled = true;
        } else if (length > 250) {
            tweetCounter.className = 'tweet-counter warning';
            tweetBtn.disabled = false;
        } else {
            tweetCounter.className = 'tweet-counter';
            tweetBtn.disabled = false;
        }

        // Live preview mapping
        tweetPreviewText.textContent = text;
    }

    // Clear Selected Composer State
    function clearSelection() {
        selectedUpdate = null;
        composerActiveState.style.display = 'none';
        composerEmptyState.style.display = 'flex';
        composerSidebar.classList.remove('active');
        
        // Remove highlight on card
        document.querySelectorAll('.note-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    // UI Loading/Status Functions
    function showLoadingState() {
        refreshBtn.disabled = true;
        refreshSpinner.classList.add('spinning');
        
        feedStatus.style.display = 'flex';
        errorStatus.style.display = 'none';
        emptyState.style.display = 'none';
        feedContainer.innerHTML = '';
        
        if (selectFirstShortcut) {
            selectFirstShortcut.style.display = 'none';
        }
    }

    function showErrorState(msg) {
        refreshBtn.disabled = false;
        refreshSpinner.classList.remove('spinning');
        
        feedStatus.style.display = 'none';
        errorStatus.style.display = 'flex';
        errorMessage.textContent = msg;
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Close sidebar composer button
    closeComposerBtn.addEventListener('click', clearSelection);
    
    // Select first update shortcut
    selectFirstShortcut.addEventListener('click', () => {
        if (allUpdates.length > 0) {
            selectUpdate(allUpdates[0]);
        }
    });

    // Live textarea editing
    tweetTextarea.addEventListener('input', updateTweetMetrics);

    // Search bar filtering
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        
        // Show/hide clear button
        if (searchQuery.length > 0) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        
        renderFeed();
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderFeed();
    });

    // Tab categories filter
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentFilter = tab.dataset.type;
            renderFeed();
        });
    });

    // Tweet Click Action
    tweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.length === 0 || text.length > 280) return;
        
        // Twitter Web Intent Url
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        // Open intent
        window.open(twitterIntentUrl, '_blank');
    });

    // Copy Update Clean Text to Clipboard
    function copyUpdateToClipboard(update, buttonElement) {
        const textToCopy = `📢 BigQuery Release Note (${update.date})\n⚡ ${update.type}: ${update.contentText}\n\nRead more: ${update.link}`;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Success visual feedback
            const icon = buttonElement.querySelector('i');
            icon.className = 'fa-solid fa-check';
            buttonElement.classList.add('copied');
            
            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
                buttonElement.classList.remove('copied');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
        });
    }

    // Export Current Filtered Updates to CSV
    function exportToCsv() {
        if (filteredUpdates.length === 0) {
            alert("No updates to export!");
            return;
        }

        // CSV Headers
        const headers = ["Date", "Type", "Description", "Link"];
        
        // Map updates to CSV rows
        const csvRows = [headers.join(",")];
        
        filteredUpdates.forEach(update => {
            // Escape double quotes by doubling them
            const dateStr = update.date.replace(/"/g, '""');
            const typeStr = update.type.replace(/"/g, '""');
            const descStr = update.contentText.replace(/"/g, '""');
            const linkStr = update.link.replace(/"/g, '""');
            
            csvRows.push(`"${dateStr}","${typeStr}","${descStr}","${linkStr}"`);
        });

        const csvContent = csvRows.join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Format filename based on filter / search parameters
        let filename = "bigquery_release_notes";
        if (currentFilter !== 'all') {
            filename += `_${currentFilter}`;
        }
        if (searchQuery) {
            // Clean filename characters
            filename += `_search_${searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
        filename += ".csv";

        // Download trigger
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Export CSV Listener
    const exportCsvBtn = document.getElementById('export-csv-btn');
    exportCsvBtn.addEventListener('click', exportToCsv);

    // Light/Dark Theme Switch Logic
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Initialize App
    fetchReleaseNotes();
});
