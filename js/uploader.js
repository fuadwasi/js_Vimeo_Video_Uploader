/**
 * Uploader Module - Handles file upload UI and operations
 */

const Uploader = (function() {
    'use strict';

    let uploadQueue = [];
    let isUploading = false;

    /**
     * Format file size to human readable format
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Format date to readable string
     */
    function formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(date).toLocaleString('en-US', options);
    }

    /**
     * Validate file type
     */
    function isValidVideoFile(file) {
        const validTypes = [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/x-flv',
            'video/webm',
            'video/mpeg',
            'video/3gpp',
            'video/x-matroska'
        ];
        return validTypes.includes(file.type) || file.name.match(/\.(mp4|mov|avi|wmv|flv|webm|mpeg|mpg|3gp|mkv)$/i);
    }

    /**
     * Create progress item UI
     */
    function createProgressItem(file, uploadId) {
        const progressContainer = $('#uploadProgress');
        
        const progressHTML = `
            <div class="progress-item" id="progress-${uploadId}">
                <div class="progress-header">
                    <span class="progress-filename">${file.name}</span>
                    <div class="progress-status">
                        <span class="spinner"></span>
                        <span class="progress-percentage">0%</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
                <div class="progress-info">
                    <small>${formatFileSize(file.size)}</small>
                </div>
            </div>
        `;
        
        progressContainer.append(progressHTML);
    }

    /**
     * Update progress item
     */
    function updateProgress(uploadId, percentage) {
        const progressItem = $(`#progress-${uploadId}`);
        progressItem.find('.progress-bar').css('width', `${percentage}%`);
        progressItem.find('.progress-percentage').text(`${Math.round(percentage)}%`);
    }

    /**
     * Mark progress as complete
     */
    function markProgressComplete(uploadId, success, message = '') {
        const progressItem = $(`#progress-${uploadId}`);
        progressItem.find('.spinner').remove();
        
        if (success) {
            progressItem.find('.progress-status').html(`
                <i class="fas fa-check-circle progress-success"></i>
                <span class="progress-percentage progress-success">Complete</span>
            `);
            progressItem.find('.progress-bar').css('width', '100%');
        } else {
            progressItem.find('.progress-status').html(`
                <i class="fas fa-times-circle progress-error"></i>
                <span class="progress-percentage progress-error">Failed</span>
            `);
            if (message) {
                progressItem.find('.progress-info').append(`<br><small class="progress-error">${message}</small>`);
            }
        }
    }

    /**
     * Upload a single file
     */
    async function uploadFile(file, uploadId) {
        try {
            // Validate file
            if (!isValidVideoFile(file)) {
                throw new Error('Invalid video file format');
            }

            // Check if Vimeo API is configured
            if (!VimeoAPI.isConfigured()) {
                throw new Error('Vimeo access token not configured');
            }

            // Upload to Vimeo with progress tracking
            const result = await VimeoAPI.uploadVideo(file, (percentage) => {
                updateProgress(uploadId, percentage);
            });

            // Save to local database
            const videoData = {
                videoName: file.name,
                fileSize: formatFileSize(file.size),
                fileSizeBytes: file.size,
                uploadTime: new Date().toISOString(),
                vimeoUrl: result.vimeoUrl,
                embedUrl: result.embedUrl,
                videoId: result.videoId,
                videoUri: result.videoUri
            };

            await DB.addVideo(videoData);

            // Mark as complete
            markProgressComplete(uploadId, true);

            // Show success notification
            showToast('Video uploaded successfully!', 'success');

            return { success: true, videoData };
        } catch (error) {
            console.error('Upload failed:', error);
            markProgressComplete(uploadId, false, error.message);
            showToast(`Upload failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Process upload queue
     */
    async function processQueue() {
        if (isUploading || uploadQueue.length === 0) {
            return;
        }

        isUploading = true;

        while (uploadQueue.length > 0) {
            const { file, uploadId } = uploadQueue.shift();
            await uploadFile(file, uploadId);
        }

        isUploading = false;

        // Refresh the table after all uploads complete
        if (window.App && window.App.refreshTable) {
            window.App.refreshTable();
        }
    }

    /**
     * Add files to upload queue
     */
    function addToQueue(files) {
        const fileArray = Array.from(files);
        
        fileArray.forEach((file, index) => {
            const uploadId = Date.now() + index;
            uploadQueue.push({ file, uploadId });
            createProgressItem(file, uploadId);
        });

        processQueue();
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const backgroundColor = {
            'success': 'linear-gradient(to right, #00b09b, #96c93d)',
            'error': 'linear-gradient(to right, #ff5f6d, #ffc371)',
            'info': 'linear-gradient(to right, #667eea, #764ba2)',
            'warning': 'linear-gradient(to right, #f093fb, #f5576c)'
        };

        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            style: {
                background: backgroundColor[type] || backgroundColor['info']
            },
            stopOnFocus: true
        }).showToast();
    }

    /**
     * Copy text to clipboard
     */
    async function copyToClipboard(text, label = 'URL') {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`${label} copied to clipboard!`, 'success');
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showToast(`${label} copied to clipboard!`, 'success');
                return true;
            } catch (err) {
                console.error('Failed to copy:', err);
                showToast('Failed to copy to clipboard', 'error');
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * Clear upload progress display
     */
    function clearProgress() {
        $('#uploadProgress').empty();
    }

    // Public API
    return {
        addToQueue,
        formatFileSize,
        formatDate,
        showToast,
        copyToClipboard,
        clearProgress,
        isValidVideoFile
    };
})();
