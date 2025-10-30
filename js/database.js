/**
 * Database Module - Handles IndexedDB operations for storing video information
 */

const DB = (function() {
    'use strict';

    const DB_NAME = 'VimeoUploaderDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'videos';
    let db = null;

    /**
     * Initialize the IndexedDB database
     */
    function init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('Database opened successfully');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Create indexes for better querying
                    objectStore.createIndex('videoName', 'videoName', { unique: false });
                    objectStore.createIndex('uploadTime', 'uploadTime', { unique: false });
                    objectStore.createIndex('vimeoUrl', 'vimeoUrl', { unique: false });
                    
                    console.log('Object store created');
                }
            };
        });
    }

    /**
     * Add a new video record to the database
     */
    function addVideo(videoData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            
            const request = objectStore.add(videoData);

            request.onsuccess = () => {
                console.log('Video added to database:', videoData.videoName);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error adding video to database');
                reject(request.error);
            };
        });
    }

    /**
     * Get all videos from the database
     */
    function getAllVideos() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error getting videos from database');
                reject(request.error);
            };
        });
    }

    /**
     * Get a specific video by ID
     */
    function getVideo(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error getting video from database');
                reject(request.error);
            };
        });
    }

    /**
     * Update an existing video record
     */
    function updateVideo(id, videoData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            
            // Get the existing record first
            const getRequest = objectStore.get(id);

            getRequest.onsuccess = () => {
                const data = getRequest.result;
                
                // Merge the new data with existing data
                const updatedData = { ...data, ...videoData, id: id };
                
                const updateRequest = objectStore.put(updatedData);

                updateRequest.onsuccess = () => {
                    console.log('Video updated in database');
                    resolve(updateRequest.result);
                };

                updateRequest.onerror = () => {
                    console.error('Error updating video in database');
                    reject(updateRequest.error);
                };
            };

            getRequest.onerror = () => {
                console.error('Error getting video for update');
                reject(getRequest.error);
            };
        });
    }

    /**
     * Delete a video from the database
     */
    function deleteVideo(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                console.log('Video deleted from database');
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting video from database');
                reject(request.error);
            };
        });
    }

    /**
     * Clear all videos from the database
     */
    function clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('All videos cleared from database');
                resolve();
            };

            request.onerror = () => {
                console.error('Error clearing database');
                reject(request.error);
            };
        });
    }

    /**
     * Search videos by name
     */
    function searchByName(searchTerm) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const allVideos = request.result;
                const filtered = allVideos.filter(video => 
                    video.videoName.toLowerCase().includes(searchTerm.toLowerCase())
                );
                resolve(filtered);
            };

            request.onerror = () => {
                console.error('Error searching videos');
                reject(request.error);
            };
        });
    }

    // Public API
    return {
        init,
        addVideo,
        getAllVideos,
        getVideo,
        updateVideo,
        deleteVideo,
        clearAll,
        searchByName
    };
})();
