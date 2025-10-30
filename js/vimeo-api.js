/**
 * Vimeo API Module - Handles all Vimeo API interactions
 */

const VimeoAPI = (function() {
    'use strict';

    let accessToken = null;
    const VIMEO_API_BASE = 'https://api.vimeo.com';

    /**
     * Set the access token for API authentication
     */
    function setAccessToken(token) {
        accessToken = token;
        // Save to localStorage for persistence
        localStorage.setItem('vimeoAccessToken', token);
    }

    /**
     * Get the stored access token
     */
    function getAccessToken() {
        if (!accessToken) {
            accessToken = localStorage.getItem('vimeoAccessToken');
        }
        return accessToken;
    }

    /**
     * Check if access token is configured
     */
    function isConfigured() {
        return !!getAccessToken();
    }

    /**
     * Extract video ID from Vimeo URL
     * Example: https://vimeo.com/1131941338 -> 1131941338
     */
    function extractVideoId(vimeoUrl) {
        const match = vimeoUrl.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
    }

    /**
     * Generate embed URL from video ID
     * Example: 1131941338 -> https://player.vimeo.com/video/1131941338
     */
    function generateEmbedUrl(videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
    }

    /**
     * Create an upload on Vimeo (Step 1: Get upload link)
     */
    async function createUpload(fileSize, fileName) {
        const token = getAccessToken();
        if (!token) {
            throw new Error('Access token not configured');
        }

        const response = await fetch(`${VIMEO_API_BASE}/me/videos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.vimeo.*+json;version=3.4'
            },
            body: JSON.stringify({
                upload: {
                    approach: 'tus',
                    size: fileSize
                },
                name: fileName,
                privacy: {
                    view: 'anybody'
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to create upload: ${response.status}`);
        }

        const data = await response.json();
        return {
            uploadLink: data.upload.upload_link,
            videoUri: data.uri,
            videoLink: data.link
        };
    }

    /**
     * Upload video file using TUS protocol (Step 2: Upload the file)
     */
    async function uploadVideoFile(file, uploadLink, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    if (onProgress) {
                        onProgress(percentComplete);
                    }
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const uploadOffset = xhr.getResponseHeader('Upload-Offset');
                    resolve({
                        success: true,
                        uploadOffset: parseInt(uploadOffset)
                    });
                } else {
                    reject(new Error(`Upload failed with status: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
            });

            // Configure TUS upload
            xhr.open('PATCH', uploadLink, true);
            xhr.setRequestHeader('Tus-Resumable', '1.0.0');
            xhr.setRequestHeader('Upload-Offset', '0');
            xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
            
            xhr.send(file);
        });
    }

    /**
     * Complete upload process (wrapper function)
     */
    async function uploadVideo(file, onProgress) {
        try {
            // Step 1: Create upload and get upload link
            const uploadData = await createUpload(file.size, file.name);
            
            // Step 2: Upload the actual file
            await uploadVideoFile(file, uploadData.uploadLink, onProgress);
            
            // Extract video ID and generate embed URL
            const videoId = extractVideoId(uploadData.videoLink);
            const embedUrl = videoId ? generateEmbedUrl(videoId) : '';

            return {
                success: true,
                vimeoUrl: uploadData.videoLink,
                embedUrl: embedUrl,
                videoUri: uploadData.videoUri,
                videoId: videoId
            };
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Get video information from Vimeo
     */
    async function getVideoInfo(videoUri) {
        const token = getAccessToken();
        if (!token) {
            throw new Error('Access token not configured');
        }

        const response = await fetch(`${VIMEO_API_BASE}${videoUri}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.vimeo.*+json;version=3.4'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get video info: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Update video metadata on Vimeo
     */
    async function updateVideoMetadata(videoUri, metadata) {
        const token = getAccessToken();
        if (!token) {
            throw new Error('Access token not configured');
        }

        const response = await fetch(`${VIMEO_API_BASE}${videoUri}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.vimeo.*+json;version=3.4'
            },
            body: JSON.stringify(metadata)
        });

        if (!response.ok) {
            throw new Error(`Failed to update video metadata: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Delete video from Vimeo
     */
    async function deleteVideo(videoUri) {
        const token = getAccessToken();
        if (!token) {
            throw new Error('Access token not configured');
        }

        const response = await fetch(`${VIMEO_API_BASE}${videoUri}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.vimeo.*+json;version=3.4'
            }
        });

        if (!response.ok && response.status !== 204) {
            throw new Error(`Failed to delete video: ${response.status}`);
        }

        return { success: true };
    }

    /**
     * Validate access token
     */
    async function validateToken(token) {
        try {
            const response = await fetch(`${VIMEO_API_BASE}/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.vimeo.*+json;version=3.4'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    // Public API
    return {
        setAccessToken,
        getAccessToken,
        isConfigured,
        extractVideoId,
        generateEmbedUrl,
        uploadVideo,
        getVideoInfo,
        updateVideoMetadata,
        deleteVideo,
        validateToken
    };
})();
