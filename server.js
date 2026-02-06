const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database bağlantısı
const db = new sqlite3.Database('./life_balance.db', (err) => {
    if (err) {
        console.error('Database bağlantı hatası:', err);
    } else {
        console.log('SQLite database bağlantısı kuruldu');
        initDatabase();
    }
});

// Database tabloları oluştur
function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL,
        light_level REAL DEFAULT 0,
        dark_level REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area_id INTEGER NOT NULL,
        action_text TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('light', 'dark')),
        is_custom INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area_id INTEGER NOT NULL,
        action_text TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('light', 'dark')),
        amount REAL NOT NULL,
        note TEXT,
        timestamp BIGINT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
    )`);

    // Varsayılan sahələri əlavə et
    initializeDefaultAreas();
}

// Varsayılan sahələri database'e ekle - HƏR SAHƏ FƏRQLI RƏNG
function initializeDefaultAreas() {
    const defaultAreas = [
        { name: 'Career', color: '#FF6B35', lightActions: ['Pul dağıtmaq', 'İxtisasını öyrənmək', 'İşyerini gözəlləndirmək'], darkActions: ['İşdən qaçmaq', 'Vaxtında bitirməmək'] },
        { name: 'Mental', color: '#00B4D8', lightActions: ['Duyğudan qacmaq', 'Şükür etmək'], darkActions: ['Porno və masaj yerləri'] },
        { name: 'Physical', color: '#E63946', lightActions: ['Yüksək intizam', 'Hərəkətsizlik'], darkActions: ['Spirtli içki', 'Tənbəllik'] },
        { name: 'Social', color: '#06FFA5', lightActions: ['Oxumu başqaları ilə müqayisə', 'Kın və küsmək'], darkActions: ['İzolasiya', 'Sosial medyada vaxt itirmək'] },
        { name: 'Romantic', color: '#F72585', lightActions: [], darkActions: ['Tənhalıq', 'Sevgisizlik'] },
        { name: 'Hobiler', color: '#7209B7', lightActions: [], darkActions: ['Hobbisizlik', 'Yaradıcılıqdan uzaqlaşma'] },
        { name: 'Finans', color: '#FFB627', lightActions: [], darkActions: ['İsraf', 'Planlaşdırma etməmə'] },
        { name: 'Spritual', color: '#4361EE', lightActions: [], darkActions: ['Mənəvi boşluq', 'Dəyərlərdən uzaqlaşma'] }
    ];

    defaultAreas.forEach(area => {
        db.get('SELECT id FROM areas WHERE name = ?', [area.name], (err, row) => {
            if (!row) {
                db.run('INSERT INTO areas (name, color) VALUES (?, ?)', 
                    [area.name, area.color], 
                    function(err) {
                        if (!err) {
                            const areaId = this.lastID;
                            
                            // Light actions əlavə et
                            area.lightActions.forEach(action => {
                                db.run('INSERT INTO actions (area_id, action_text, type) VALUES (?, ?, ?)',
                                    [areaId, action, 'light']);
                            });
                            
                            // Dark actions əlavə et
                            area.darkActions.forEach(action => {
                                db.run('INSERT INTO actions (area_id, action_text, type) VALUES (?, ?, ?)',
                                    [areaId, action, 'dark']);
                            });
                        }
                    }
                );
            }
        });
    });
}

// API Endpoints

// Bütün sahələri və onların məlumatlarını gətir
app.get('/api/areas', (req, res) => {
    const query = `
        SELECT 
            a.id,
            a.name,
            a.color,
            a.light_level,
            a.dark_level
        FROM areas a
        ORDER BY a.id
    `;
    
    db.all(query, [], (err, areas) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Hər bir sahə üçün actions və history gətir
        const promises = areas.map(area => {
            return new Promise((resolve) => {
                // Actions gətir
                db.all('SELECT action_text, type FROM actions WHERE area_id = ? ORDER BY id', 
                    [area.id], 
                    (err, actions) => {
                        const lightActions = actions.filter(a => a.type === 'light').map(a => a.action_text);
                        const darkActions = actions.filter(a => a.type === 'dark').map(a => a.action_text);
                        
                        // History gətir
                        db.all('SELECT * FROM history WHERE area_id = ? ORDER BY timestamp', 
                            [area.id], 
                            (err, history) => {
                                resolve({
                                    name: area.name,
                                    color: area.color,
                                    lightLevel: area.light_level,
                                    darkLevel: area.dark_level,
                                    lightActions: lightActions,
                                    darkActions: darkActions,
                                    history: history.map(h => ({
                                        action: h.action_text,
                                        type: h.type,
                                        amount: h.amount,
                                        note: h.note,
                                        date: new Date(h.timestamp).toLocaleString('az-AZ'),
                                        timestamp: h.timestamp
                                    }))
                                });
                            }
                        );
                    }
                );
            });
        });
        
        Promise.all(promises).then(result => {
            res.json(result);
        });
    });
});

// Sahənin səviyyəsini yenilə
app.put('/api/areas/:name/levels', (req, res) => {
    const { name } = req.params;
    const { lightLevel, darkLevel } = req.body;
    
    db.run(
        'UPDATE areas SET light_level = ?, dark_level = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
        [lightLevel, darkLevel, name],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

// Yeni action əlavə et
app.post('/api/areas/:name/actions', (req, res) => {
    const { name } = req.params;
    const { action, type } = req.body;
    
    db.get('SELECT id FROM areas WHERE name = ?', [name], (err, area) => {
        if (err || !area) {
            return res.status(404).json({ error: 'Area not found' });
        }
        
        db.run(
            'INSERT INTO actions (area_id, action_text, type, is_custom) VALUES (?, ?, ?, 1)',
            [area.id, action, type],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, id: this.lastID });
            }
        );
    });
});

// Action redaktə et
app.put('/api/actions/:id', (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    
    db.run(
        'UPDATE actions SET action_text = ? WHERE id = ?',
        [action, id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

// Action sil
app.delete('/api/actions/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM actions WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// Tarixçəyə əməl əlavə et
app.post('/api/areas/:name/history', (req, res) => {
    const { name } = req.params;
    const { action, type, amount, note, timestamp } = req.body;
    
    db.get('SELECT id FROM areas WHERE name = ?', [name], (err, area) => {
        if (err || !area) {
            return res.status(404).json({ error: 'Area not found' });
        }
        
        // History əlavə et
        db.run(
            'INSERT INTO history (area_id, action_text, type, amount, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [area.id, action, type, amount, note || '', timestamp],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Sahənin səviyyəsini yenilə
                const updateField = type === 'light' ? 'light_level' : 'dark_level';
                db.run(
                    `UPDATE areas SET ${updateField} = ${updateField} + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [amount, area.id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ success: true, historyId: this.lastID });
                    }
                );
            }
        );
    });
});

// Sahəni sıfırla
app.delete('/api/areas/:name/reset', (req, res) => {
    const { name } = req.params;
    
    db.get('SELECT id FROM areas WHERE name = ?', [name], (err, area) => {
        if (err || !area) {
            return res.status(404).json({ error: 'Area not found' });
        }
        
        // History sil
        db.run('DELETE FROM history WHERE area_id = ?', [area.id], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Səviyyələri sıfırla
            db.run(
                'UPDATE areas SET light_level = 0, dark_level = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [area.id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ success: true });
                }
            );
        });
    });
});

// Bütün sahələri sıfırla
app.delete('/api/areas/reset-all', (req, res) => {
    db.run('DELETE FROM history', [], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        db.run('UPDATE areas SET light_level = 0, dark_level = 0, updated_at = CURRENT_TIMESTAMP', 
            [], 
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
            }
        );
    });
});

// Server başlat
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} portunda çalışıyor`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Database kapatma hatası:', err);
        } else {
            console.log('Database bağlantısı kapatıldı');
        }
        process.exit(0);
    });
});

