export interface SelempangAsset {
    id: string;
    name: string;
    type: 'ornamen' | 'skin' | 'font';
    category: 'skin' | 'logo' | 'tengah' | 'tahun' | 'bawah_atas' | 'bawah_sudut' | 'motif' | 'font';
    data: string;
    createdAt: string;
}

const idb = {
    dbName: 'kinau_production_db',
    storeName: 'large_assets',
    version: 1,

    async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                return reject(new Error('IndexedDB is not available on server-side'));
            }
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async set(key: string, val: any): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).put(val, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async get(key: string): Promise<any> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const req = tx.objectStore(this.storeName).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
};

const KEY = 'kinau_selempang_assets_v1_idb';

export const loadSelempangAssets = async (): Promise<SelempangAsset[]> => {
    if (typeof window === 'undefined') return [];
    try {
        const v = await idb.get(KEY);
        return v || [];
    } catch { return []; }
};

export const saveSelempangAssets = async (data: SelempangAsset[]): Promise<void> => {
    if (typeof window === 'undefined') return;
    await idb.set(KEY, data);
};
