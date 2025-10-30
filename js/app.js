/**
 * Main Application Module - Coordinates all components
 */

const App = (function() {
    'use strict';

    let videosTable = null;

    /**
     * Initialize the application
     */
    async function init() {
        try {
            // Initialize database
            await DB.init();
            console.log('Database initialized');

            // Setup UI event handlers
            setupEventHandlers();

            // Load saved configuration
            loadConfiguration();

            // Initialize DataTable
            initializeDataTable();

            // Load existing videos
            await refreshTable();

            console.log('Application initialized successfully');
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

        // Browse button click
        $('#browseBtn').on('click', function(e) {
            e.stopPropagation();
            $('#fileInput').click();
        });

        // File input change
        $('#fileInput').on('change', function() {
            if (this.files.length > 0) {
                handleFileSelection(this.files);
                this.value = ''; // Reset input
            }
        });

        // Drag and drop events
        const uploadArea = $('#uploadArea')[0];

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('drag-over');
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('drag-over');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelection(files);
            }
        });

        // Click on upload area to trigger file picker
        $('#uploadArea').on('click', function(e) {
            if (e.target === this || $(e.target).closest('.upload-content').length) {
                $('#fileInput').click();
            }
        });

        // Modal close button
        $('.close').on('click', closeModal);
        $('#cancelEdit').on('click', closeModal);

        // Edit form submit
        $('#editForm').on('submit', handleEditSubmit);

        // Close modal when clicking outside
        $(window).on('click', function(e) {
            if (e.target.id === 'editModal') {
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
            Uploader.showToast('API configuration loaded', 'info');
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
     * Handle file selection
     */
    function handleFileSelection(files) {
        if (!VimeoAPI.isConfigured()) {
            Uploader.showToast('Please configure your Vimeo access token first', 'warning');
            return;
        }

        // Validate files
        const videoFiles = Array.from(files).filter(file => {
            if (!Uploader.isValidVideoFile(file)) {
                Uploader.showToast(`Invalid file: ${file.name}`, 'error');
                return false;
            }
            return true;
        });

        if (videoFiles.length === 0) {
            Uploader.showToast('No valid video files selected', 'warning');
            return;
        }

        // Add to upload queue
        Uploader.addToQueue(videoFiles);
    }

    /**
     * Initialize DataTable
     */
    function initializeDataTable() {
        videosTable = $('#videosTable').DataTable({
            order: [[2, 'desc']], // Sort by upload time (newest first)
            pageLength: 10,
            responsive: true,
            language: {
                emptyTable: '<div class="empty-state"><i class="fas fa-inbox"></i><p>No videos uploaded yet</p></div>',
                search: '_INPUT_',
                searchPlaceholder: 'Search videos...'
            },
            columnDefs: [
                { 
                    targets: [3, 4], // URL columns
                    orderable: false 
                },
                {
                    targets: 5, // Actions column
                    orderable: false
                }
            ]
        });
    }

    /**
     * Refresh the videos table
     */
    async function refreshTable() {
        try {
            const videos = await DB.getAllVideos();
            
            // Clear existing rows
            videosTable.clear();

            // Add rows for each video
            videos.forEach(video => {
                const row = [
                    video.videoName,
                    video.fileSize,
                    Uploader.formatDate(video.uploadTime),
                    createUrlCell(video.vimeoUrl, 'Vimeo URL'),
                    createUrlCell(video.embedUrl, 'Embed URL'),
                    createActionButtons(video.id)
                ];
                
                videosTable.row.add(row);
            });

            // Redraw table
            videosTable.draw();

            // Re-attach event handlers to new buttons
            attachTableEventHandlers();
        } catch (error) {
            console.error('Failed to refresh table:', error);
            Uploader.showToast('Failed to load videos', 'error');
        }
    }

    /**
     * Create URL cell with copy button
     */
    function createUrlCell(url, label) {
        return `
            <div class="url-cell">
                <span class="url-text">${url}</span>
                <button class="btn btn-copy" data-url="${url}" data-label="${label}">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `;
    }

    /**
     * Create action buttons
     */
    function createActionButtons(videoId) {
        return `
            <div class="action-buttons">
                <button class="btn btn-edit" data-id="${videoId}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" data-id="${videoId}">
                    <i class="fas fa-trash"></i> Delete
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

        // Edit buttons
        $('.btn-edit').off('click').on('click', function() {
            const videoId = $(this).data('id');
            openEditModal(videoId);
        });

        // Delete buttons
        $('.btn-danger').off('click').on('click', function() {
            const videoId = $(this).data('id');
            handleDelete(videoId);
        });
    }

    /**
     * Open edit modal
     */
    async function openEditModal(videoId) {
        try {
            const video = await DB.getVideo(videoId);
            
            if (video) {
                $('#editVideoName').val(video.videoName);
                $('#editVideoId').val(videoId);
                $('#editModal').fadeIn(300);
            }
        } catch (error) {
            console.error('Failed to load video for editing:', error);
            Uploader.showToast('Failed to load video information', 'error');
        }
    }

    /**
     * Close modal
     */
    function closeModal() {
        $('#editModal').fadeOut(300);
        $('#editForm')[0].reset();
    }

    /**
     * Handle edit form submit
     */
    async function handleEditSubmit(e) {
        e.preventDefault();
        
        const videoId = parseInt($('#editVideoId').val());
        const newName = $('#editVideoName').val().trim();

        if (!newName) {
            Uploader.showToast('Please enter a video name', 'warning');
            return;
        }

        try {
            await DB.updateVideo(videoId, { videoName: newName });
            Uploader.showToast('Video information updated successfully!', 'success');
            closeModal();
            await refreshTable();
        } catch (error) {
            console.error('Failed to update video:', error);
            Uploader.showToast('Failed to update video information', 'error');
        }
    }

    /**
     * Handle delete action
     */
    async function handleDelete(videoId) {
        const confirmed = confirm('Are you sure you want to delete this video from the local database? This will not delete the video from Vimeo.');
        
        if (!confirmed) {
            return;
        }

        try {
            await DB.deleteVideo(videoId);
            Uploader.showToast('Video deleted from local database', 'success');
            await refreshTable();
        } catch (error) {
            console.error('Failed to delete video:', error);
            Uploader.showToast('Failed to delete video', 'error');
        }
    }

    /**
     * Export videos to JSON
     */
    async function exportToJSON() {
        try {
            const videos = await DB.getAllVideos();
            const dataStr = JSON.stringify(videos, null, 2);
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
    async function exportToCSV() {
        try {
            const videos = await DB.getAllVideos();
            
            // Create CSV headers
            const headers = ['Video Name', 'File Size', 'Upload Time', 'Vimeo URL', 'Embed URL'];
            const csvContent = [
                headers.join(','),
                ...videos.map(v => [
                    `"${v.videoName}"`,
                    `"${v.fileSize}"`,
                    `"${Uploader.formatDate(v.uploadTime)}"`,
                    `"${v.vimeoUrl}"`,
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
        refreshTable,
        exportToJSON,
        exportToCSV
    };
})();

// Make App globally accessible
window.App = App;
