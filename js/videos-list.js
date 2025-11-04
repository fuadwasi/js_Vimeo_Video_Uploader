/**
 * Videos List Module - Handles fetching and displaying videos from Vimeo
 */

const VideosList = (function() {
    'use strict';

    let videosTable = null;
    let currentPage = 1;
    let totalPages = 1;
    let allVideos = [];

    /**
     * Initialize the application
     */
    async function init() {
        try {
            // Setup UI event handlers
            setupEventHandlers();

            // Load saved configuration
            loadConfiguration();

            // Initialize DataTable
            initializeDataTable();

            console.log('Videos List initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            Uploader.showToast('Failed to initialize application', 'error');
        }
    }

    /**
     * Setup all event handlers
     */
    function setupEventHandlers() {
        // Save configuration button
        $('#saveConfig').on('click', handleSaveConfig);

        // Load videos button
        $('#loadVideos').on('click', loadVideosFromVimeo);

        // Export buttons
        $('#exportExcel').on('click', exportToCSV);
        $('#exportJSON').on('click', exportToJSON);

        // Pagination buttons
        $('#prevPage').on('click', () => changePage(currentPage - 1));
        $('#nextPage').on('click', () => changePage(currentPage + 1));

        // Modal close button
        $('.close').on('click', closeModal);

        // Close modal when clicking outside
        $(window).on('click', function(e) {
            if (e.target.id === 'previewModal' || e.target.id === 'detailsModal') {
                closeModal();
            }
        });
    }

    /**
     * Load saved configuration
     */
    function loadConfiguration() {
        const savedToken = VimeoAPI.getAccessToken();
        if (savedToken) {
            $('#accessToken').val(savedToken);
        }
    }

    /**
     * Handle save configuration
     */
    async function handleSaveConfig() {
        const token = $('#accessToken').val().trim();
        
        if (!token) {
            Uploader.showToast('Please enter an access token', 'warning');
            return;
        }

        // Show loading state
        const $btn = $('#saveConfig');
        const originalText = $btn.html();
        $btn.html('<i class="fas fa-spinner fa-spin"></i> Validating...').prop('disabled', true);

        try {
            // Validate token
            const isValid = await VimeoAPI.validateToken(token);
            
            if (isValid) {
                VimeoAPI.setAccessToken(token);
                Uploader.showToast('Configuration saved successfully!', 'success');
            } else {
                throw new Error('Invalid access token');
            }
        } catch (error) {
            console.error('Configuration error:', error);
            Uploader.showToast('Invalid access token. Please check and try again.', 'error');
        } finally {
            $btn.html(originalText).prop('disabled', false);
        }
    }

    /**
     * Initialize DataTable
     */
    function initializeDataTable() {
        videosTable = $('#videosTable').DataTable({
            order: [[3, 'desc']], // Sort by created date (newest first)
            pageLength: 25,
            responsive: true,
            language: {
                emptyTable: '<div class="empty-state"><i class="fas fa-inbox"></i><p>No videos loaded. Click "Load Videos" to fetch from Vimeo.</p></div>',
                search: '_INPUT_',
                searchPlaceholder: 'Search videos...'
            },
            columnDefs: [
                { 
                    targets: [0], // Thumbnail
                    orderable: false,
                    width: '80px'
                },
                { 
                    targets: [8, 9], // URL columns
                    orderable: false 
                },
                {
                    targets: 10, // Actions column
                    orderable: false
                }
            ]
        });
    }

    /**
     * Load videos from Vimeo API
     */
    async function loadVideosFromVimeo() {
        if (!VimeoAPI.isConfigured()) {
            Uploader.showToast('Please configure your Vimeo access token first', 'warning');
            return;
        }

        const sortBy = $('#sortBy').val();
        const sortDirection = $('#sortDirection').val();
        const perPage = parseInt($('#perPage').val());

        // Show loading indicator
        $('#loadingIndicator').show();
        $('#videoStats').hide();
        
        // Disable load button
        const $btn = $('#loadVideos');
        const originalText = $btn.html();
        $btn.html('<i class="fas fa-spinner fa-spin"></i> Loading...').prop('disabled', true);

        try {
            const result = await VimeoAPI.getMyVideos(currentPage, perPage, sortBy, sortDirection);
            
            allVideos = result.videos;
            totalPages = result.totalPages;
            
            // Update statistics
            updateStatistics(result.videos, result.total);
            
            // Display videos
            displayVideos(result.videos);
            
            // Update pagination
            updatePagination(result.page, result.totalPages);
            
            Uploader.showToast(`Loaded ${result.videos.length} videos successfully!`, 'success');
        } catch (error) {
            console.error('Failed to load videos:', error);
            Uploader.showToast(`Failed to load videos: ${error.message}`, 'error');
        } finally {
            $('#loadingIndicator').hide();
            $btn.html(originalText).prop('disabled', false);
        }
    }

    /**
     * Display videos in the table
     */
    function displayVideos(videos) {
        // Clear existing rows
        videosTable.clear();

        // Add rows for each video
        videos.forEach(video => {
            const row = [
                createThumbnailCell(video.thumbnail, video.name),
                video.name || 'Untitled',
                formatDuration(video.duration),
                formatDate(video.createdTime),
                createStatusBadge(video.status),
                createPrivacyBadge(video.privacy),
                formatNumber(video.stats.plays),
                formatNumber(video.stats.likes),
                createUrlCell(video.link, 'Vimeo URL'),
                createUrlCell(video.embedUrl, 'Embed URL'),
                createActionButtons(video)
            ];
            
            videosTable.row.add(row);
        });

        // Redraw table
        videosTable.draw();

        // Re-attach event handlers to new buttons
        attachTableEventHandlers();
    }

    /**
     * Create thumbnail cell
     */
    function createThumbnailCell(thumbnailUrl, altText) {
        if (thumbnailUrl) {
            return `<img src="${thumbnailUrl}" alt="${altText}" class="video-thumbnail">`;
        }
        return '<div class="video-thumbnail-placeholder"><i class="fas fa-video"></i></div>';
    }

    /**
     * Format duration from seconds to HH:MM:SS or MM:SS
     */
    function formatDuration(seconds) {
        if (!seconds) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Format date to readable string
     */
    function formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        };
        return new Date(dateString).toLocaleString('en-US', options);
    }

    /**
     * Format number with commas
     */
    function formatNumber(num) {
        return num.toLocaleString();
    }

    /**
     * Create status badge
     */
    function createStatusBadge(status) {
        const statusColors = {
            'available': 'success',
            'uploading': 'warning',
            'processing': 'warning',
            'transcoding': 'warning',
            'error': 'danger'
        };
        
        const colorClass = statusColors[status] || 'secondary';
        return `<span class="badge badge-${colorClass}">${status}</span>`;
    }

    /**
     * Create privacy badge
     */
    function createPrivacyBadge(privacy) {
        const privacyIcons = {
            'anybody': 'fa-globe',
            'nobody': 'fa-lock',
            'contacts': 'fa-user-friends',
            'password': 'fa-key',
            'unlisted': 'fa-eye-slash'
        };
        
        const icon = privacyIcons[privacy] || 'fa-question';
        return `<span class="privacy-badge"><i class="fas ${icon}"></i> ${privacy || 'unknown'}</span>`;
    }

    /**
     * Create URL cell with copy button
     */
    function createUrlCell(url, label) {
        const urlContent = label === 'Vimeo URL' 
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="url-link">${url}</a>`
            : `<span class="url-text">${url}</span>`;
        
        return `
            <div class="url-cell">
                ${urlContent}
                <button class="btn btn-copy" data-url="${url}" data-label="${label}">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `;
    }

    /**
     * Create action buttons
     */
    function createActionButtons(video) {
        return `
            <div class="action-buttons">
                <button class="btn btn-details" data-video='${JSON.stringify(video).replace(/'/g, "&apos;")}' title="View Details">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button class="btn btn-preview" data-video='${JSON.stringify(video).replace(/'/g, "&apos;")}' title="Preview Video">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn btn-info" data-url="${video.link}" title="Open in Vimeo">
                    <i class="fas fa-external-link-alt"></i>
                </button>
            </div>
        `;
    }

    /**
     * Attach event handlers to table buttons
     */
    function attachTableEventHandlers() {
        // Copy buttons
        $('.btn-copy').off('click').on('click', function() {
            const url = $(this).data('url');
            const label = $(this).data('label');
            Uploader.copyToClipboard(url, label);
        });

        // Details buttons
        $('.btn-details').off('click').on('click', function() {
            const videoData = $(this).data('video');
            openDetailsModal(videoData);
        });

        // Preview buttons
        $('.btn-preview').off('click').on('click', function() {
            const videoData = $(this).data('video');
            openPreviewModal(videoData);
        });

        // External link buttons
        $('.btn-info').off('click').on('click', function() {
            const url = $(this).data('url');
            window.open(url, '_blank');
        });
    }

    /**
     * Open details modal with comprehensive video information
     */
    function openDetailsModal(video) {
        const details = `
            <div class="video-details-header">
                ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${video.name}" class="details-thumbnail">` : '<div class="details-thumbnail-placeholder"><i class="fas fa-video"></i></div>'}
                <div class="details-title-section">
                    <h3>${video.name || 'Untitled Video'}</h3>
                    <div class="details-badges">
                        ${createStatusBadge(video.status)}
                        ${createPrivacyBadge(video.privacy)}
                    </div>
                </div>
            </div>

            ${video.description ? `
                <div class="details-section">
                    <h4><i class="fas fa-align-left"></i> Description</h4>
                    <p class="video-description">${video.description.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}

            <div class="details-section">
                <h4><i class="fas fa-info-circle"></i> Video Information</h4>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-clock"></i> Duration:</span>
                        <span class="detail-value">${formatDuration(video.duration)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-calendar-plus"></i> Created:</span>
                        <span class="detail-value">${formatDate(video.createdTime)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-calendar-edit"></i> Modified:</span>
                        <span class="detail-value">${formatDate(video.modifiedTime)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-expand"></i> Resolution:</span>
                        <span class="detail-value">${video.width} x ${video.height}</span>
                    </div>
                </div>
            </div>

            <div class="details-section">
                <h4><i class="fas fa-chart-bar"></i> Statistics</h4>
                <div class="details-stats">
                    <div class="stat-box">
                        <i class="fas fa-eye"></i>
                        <div class="stat-content">
                            <div class="stat-number">${formatNumber(video.stats.plays)}</div>
                            <div class="stat-label">Plays</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <i class="fas fa-heart"></i>
                        <div class="stat-content">
                            <div class="stat-number">${formatNumber(video.stats.likes)}</div>
                            <div class="stat-label">Likes</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <i class="fas fa-comment"></i>
                        <div class="stat-content">
                            <div class="stat-number">${formatNumber(video.stats.comments)}</div>
                            <div class="stat-label">Comments</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="details-section">
                <h4><i class="fas fa-link"></i> Links & Embed</h4>
                <div class="details-links">
                    <div class="link-item">
                        <label>Vimeo URL:</label>
                        <div class="link-box">
                            <input type="text" value="${video.link}" readonly>
                            <button class="btn btn-copy-inline" data-url="${video.link}">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                    <div class="link-item">
                        <label>Embed URL:</label>
                        <div class="link-box">
                            <input type="text" value="${video.embedUrl}" readonly>
                            <button class="btn btn-copy-inline" data-url="${video.embedUrl}">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                    <div class="link-item">
                        <label>Video ID:</label>
                        <div class="link-box">
                            <input type="text" value="${video.videoId}" readonly>
                            <button class="btn btn-copy-inline" data-url="${video.videoId}">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="details-actions">
                <button class="btn btn-primary" onclick="window.open('${video.link}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Open in Vimeo
                </button>
                <button class="btn btn-secondary" onclick="$('#detailsModal').fadeOut(300)">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        $('#videoDetailsContent').html(details);
        $('#detailsModal').fadeIn(300);

        // Attach copy button handlers
        $('.btn-copy-inline').off('click').on('click', function() {
            const url = $(this).data('url');
            Uploader.copyToClipboard(url, 'Link');
        });
    }

    /**
     * Open preview modal
     */
    function openPreviewModal(video) {
        // Create iframe for video
        const iframe = `
            <iframe src="${video.embedUrl}" 
                    width="100%" 
                    height="400" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen>
            </iframe>
        `;
        
        // Create video details
        const details = `
            <h3>${video.name || 'Untitled'}</h3>
            ${video.description ? `<p>${video.description}</p>` : ''}
            <div class="video-meta">
                <div class="meta-item"><strong>Duration:</strong> ${formatDuration(video.duration)}</div>
                <div class="meta-item"><strong>Created:</strong> ${formatDate(video.createdTime)}</div>
                <div class="meta-item"><strong>Status:</strong> ${createStatusBadge(video.status)}</div>
                <div class="meta-item"><strong>Privacy:</strong> ${createPrivacyBadge(video.privacy)}</div>
                <div class="meta-item"><strong>Plays:</strong> ${formatNumber(video.stats.plays)}</div>
                <div class="meta-item"><strong>Likes:</strong> ${formatNumber(video.stats.likes)}</div>
                <div class="meta-item"><strong>Comments:</strong> ${formatNumber(video.stats.comments)}</div>
            </div>
        `;
        
        $('#videoPreviewContainer').html(iframe);
        $('#videoDetails').html(details);
        $('#previewModal').fadeIn(300);
    }

    /**
     * Close modal
     */
    function closeModal() {
        $('#previewModal').fadeOut(300, function() {
            $('#videoPreviewContainer').empty();
            $('#videoDetails').empty();
        });
        $('#detailsModal').fadeOut(300, function() {
            $('#videoDetailsContent').empty();
        });
    }

    /**
     * Update statistics
     */
    function updateStatistics(videos, total) {
        const totalPlays = videos.reduce((sum, v) => sum + v.stats.plays, 0);
        const totalLikes = videos.reduce((sum, v) => sum + v.stats.likes, 0);
        const totalComments = videos.reduce((sum, v) => sum + v.stats.comments, 0);
        
        $('#totalVideos').text(formatNumber(total));
        $('#totalPlays').text(formatNumber(totalPlays));
        $('#totalLikes').text(formatNumber(totalLikes));
        $('#totalComments').text(formatNumber(totalComments));
        
        $('#videoStats').fadeIn();
    }

    /**
     * Update pagination
     */
    function updatePagination(page, pages) {
        currentPage = page;
        totalPages = pages;
        
        $('#pageInfo').text(`Page ${page} of ${pages}`);
        $('#prevPage').prop('disabled', page <= 1);
        $('#nextPage').prop('disabled', page >= pages);
        
        if (pages > 1) {
            $('#pagination').show();
        } else {
            $('#pagination').hide();
        }
    }

    /**
     * Change page
     */
    async function changePage(newPage) {
        if (newPage < 1 || newPage > totalPages) return;
        
        currentPage = newPage;
        await loadVideosFromVimeo();
    }

    /**
     * Export videos to JSON
     */
    function exportToJSON() {
        try {
            if (allVideos.length === 0) {
                Uploader.showToast('No videos to export', 'warning');
                return;
            }

            const dataStr = JSON.stringify(allVideos, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vimeo-videos-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            Uploader.showToast('Videos exported to JSON', 'success');
        } catch (error) {
            console.error('Failed to export:', error);
            Uploader.showToast('Failed to export videos', 'error');
        }
    }

    /**
     * Export videos to CSV
     */
    function exportToCSV() {
        try {
            if (allVideos.length === 0) {
                Uploader.showToast('No videos to export', 'warning');
                return;
            }

            // Create CSV headers
            const headers = ['Video Name', 'Duration', 'Created', 'Status', 'Privacy', 'Plays', 'Likes', 'Comments', 'Vimeo URL', 'Embed URL'];
            const csvContent = [
                headers.join(','),
                ...allVideos.map(v => [
                    `"${v.name || 'Untitled'}"`,
                    `"${formatDuration(v.duration)}"`,
                    `"${formatDate(v.createdTime)}"`,
                    `"${v.status}"`,
                    `"${v.privacy}"`,
                    v.stats.plays,
                    v.stats.likes,
                    v.stats.comments,
                    `"${v.link}"`,
                    `"${v.embedUrl}"`
                ].join(','))
            ].join('\n');
            
            const dataBlob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vimeo-videos-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            Uploader.showToast('Videos exported to CSV', 'success');
        } catch (error) {
            console.error('Failed to export:', error);
            Uploader.showToast('Failed to export videos', 'error');
        }
    }

    // Initialize when DOM is ready
    $(document).ready(function() {
        init();
    });

    // Public API
    return {
        loadVideosFromVimeo,
        exportToJSON,
        exportToCSV
    };
})();

// Make VideosList globally accessible
window.VideosList = VideosList;
