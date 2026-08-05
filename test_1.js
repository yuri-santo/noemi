
        /* =================================================================
           ⚠️ ATENÇÃO: COLOQUE SUAS CHAVES DO SUPABASE AQUI ⚠️
           ================================================================= */
        const SUPABASE_URL = "https://izphobguvtfjqzrsbkva.supabase.co"; // URL do seu projeto Supabase
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cGhvYmd1dnRmanF6cnNia3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2OTYzMjEsImV4cCI6MjEwMTI3MjMyMX0.EyLTpW7y1-UV4qllmw6Nh0mjN0r2wLQzxbmp99iHGOg"; // Chave pública fornecida
        
        let supabase = null;
        if (SUPABASE_URL !== "SUA_URL_AQUI") {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        // LÓGICA DE AUTENTICAÇÃO
        function checkAuth() {
            const pwd = document.getElementById('auth-pwd').value;
            if (pwd === 'Familia@vidal.36') {
                document.getElementById('auth-overlay').style.display = 'none';
                document.body.style.overflow = 'auto';
                const main = document.getElementById('main-content');
                main.style.opacity = '1';
                main.style.pointerEvents = 'auto';
            } else {
                const err = document.getElementById('auth-error');
                err.style.display = 'block';
                err.classList.add('animate-bounce');
                setTimeout(() => err.classList.remove('animate-bounce'), 1000);
            }
        }

        // TAB NAVIGATION
        let activeTab = 'rsvp';
        window.switchTab = function(tab) {
            activeTab = tab;
            const btnRsvp = document.getElementById('tab-rsvp');
            const btnGuests = document.getElementById('tab-guests');
            const viewRsvp = document.getElementById('view-rsvp');
            const viewGuests = document.getElementById('view-guests');

            if (tab === 'rsvp') {
                btnRsvp.className = "flex-1 py-3 bg-ark-darkblue text-white rounded-xl font-bold shadow-md transition-all";
                btnGuests.className = "flex-1 py-3 bg-white text-gray-500 rounded-xl font-bold shadow-sm transition-all hover:bg-gray-50 border border-gray-200";
                viewRsvp.classList.remove('hidden');
                viewGuests.classList.add('hidden');
                render();
            } else {
                btnGuests.className = "flex-1 py-3 bg-ark-darkblue text-white rounded-xl font-bold shadow-md transition-all";
                btnRsvp.className = "flex-1 py-3 bg-white text-gray-500 rounded-xl font-bold shadow-sm transition-all hover:bg-gray-50 border border-gray-200";
                viewGuests.classList.remove('hidden');
                viewRsvp.classList.add('hidden');
                renderGuests();
            }
        };

        // Dados baseados no localStorage
        (function() {
            const tableBody   = document.getElementById('table-body');
            const searchInput = document.getElementById('search-input');
            const statTotal   = document.getElementById('stat-total');
            const statGoing   = document.getElementById('stat-going');
            const statNotGoing = document.getElementById('stat-notgoing');
            const statPeople  = document.getElementById('stat-people');
            
            let currentFilter = 'all';
            let searchQuery = '';

            let loadedRecords = [];

            async function loadData() {
                if (supabase) {
                    const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
                    if (!error && data) {
                        loadedRecords = data.map(row => ({
                            names: row.guest_names.split(',').map(n => n.trim()),
                            isGoing: row.is_going,
                            timestamp: row.created_at,
                            headcount: row.headcount
                        }));
                        return loadedRecords;
                    }
                }
                
                // Fallback para LocalStorage se Supabase falhar
                try { 
                    const stored = JSON.parse(localStorage.getItem('arca_noemi_rsvps') || '[]');
                    loadedRecords = stored.map(row => ({
                        names: row.guest_names ? row.guest_names.split(',').map(n => n.trim()) : (row.names || []),
                        isGoing: row.is_going !== undefined ? row.is_going : row.isGoing,
                        timestamp: row.created_at || row.date || new Date().toISOString(),
                        headcount: row.headcount || (row.names ? row.names.length : 1)
                    }));
                } catch (e) {
                    loadedRecords = [];
                }
                return loadedRecords;
            }

            function formatDate(iso) {
                const d = new Date(iso);
                const today = new Date();
                const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                
                const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                if (isToday) return `Hoje às ${time}`;
                return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + time;
            }

            function getInitials(name) {
                const parts = name.trim().split(' ');
                if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }

            async function render() {
                const records = await loadData();

                if (records.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="4" class="py-16 text-center">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300 text-2xl"><i class="fa-solid fa-ghost"></i></div>
                        <p class="text-gray-500 font-semibold">Nenhuma confirmação registrada ainda.</p>
                        <p class="text-xs text-gray-400 mt-1">Os registros aparecerão aqui quando os convidados responderem.</p>
                    </td></tr>`;
                    updateStats(0,0,0,0);
                    return;
                }

                // Stats
                const totalRecords = records.length;
                const goingRecords = records.filter(r => r.isGoing).length;
                const notGoingRecords = records.filter(r => !r.isGoing).length;
                let totalPeople = 0;
                records.forEach(r => { if (r.isGoing) totalPeople += r.headcount; });
                updateStats(totalRecords, goingRecords, notGoingRecords, totalPeople);

                // Filtrar e Buscar (Supabase já vem com o mais novo primeiro, mas o fallback pode precisar)
                let filtered = [...records];
                
                if (currentFilter === 'going') filtered = filtered.filter(r => r.isGoing);
                if (currentFilter === 'notgoing') filtered = filtered.filter(r => !r.isGoing);
                
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    filtered = filtered.filter(r => r.names.some(n => n.toLowerCase().includes(q)));
                }

                if (filtered.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-gray-400 font-semibold">Nenhum resultado encontrado para a busca.</td></tr>`;
                    return;
                }

                tableBody.innerHTML = filtered.map(r => {
                    const namesList = r.names || ['Desconhecido'];
                    const mainName = namesList[0];
                    const initials = getInitials(mainName);
                    
                    const namesHtml = namesList.map((n, i) => {
                        if (i === 0) return `<span class="font-bold text-gray-800">${n}</span>`;
                        return `<span class="text-gray-500">${n}</span>`;
                    }).join('<span class="mx-1 text-gray-300">•</span>');

                    const statusHtml = r.isGoing
                        ? '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 font-bold text-[11px] uppercase tracking-wide border border-green-100"><i class="fa-solid fa-check"></i> Vai</span>'
                        : '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-500 font-bold text-[11px] uppercase tracking-wide border border-red-100"><i class="fa-solid fa-xmark"></i> Não vai</span>';

                    return `
                        <tr class="hover:bg-blue-50/30 transition-colors group">
                            <td class="py-4 pl-6 pr-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full avatar-initials flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        ${initials}
                                    </div>
                                    <div class="truncate max-w-[200px] sm:max-w-xs">${namesHtml}</div>
                                </div>
                            </td>
                            <td class="py-4 px-4 text-center">
                                <span class="font-cute text-lg ${r.isGoing ? 'text-gray-700' : 'text-gray-300'}">${r.isGoing ? r.headcount : '-'}</span>
                            </td>
                            <td class="py-4 px-4 text-center">${statusHtml}</td>
                            <td class="py-4 pr-6 pl-4 text-right text-xs text-gray-400 font-medium group-hover:text-gray-600">${formatDate(r.timestamp)}</td>
                        </tr>
                    `;
                }).join('');
            }

            function updateStats(total, going, notGoing, people) {
                statTotal.textContent = total;
                statGoing.textContent = going;
                statNotGoing.textContent = notGoing;
                statPeople.textContent = people;
            }

            window.filterTable = function(filter) {
                currentFilter = filter;
                const activeCls = "flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm bg-white text-gray-800";
                const inactiveCls = "flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-500 hover:text-gray-700";
                
                document.getElementById('btn-all').className = filter === 'all' ? activeCls : inactiveCls;
                document.getElementById('btn-going').className = filter === 'going' ? activeCls : inactiveCls;
                document.getElementById('btn-notgoing').className = filter === 'notgoing' ? activeCls : inactiveCls;
                
                render();
            };

            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                render();
            });

            window.clearData = function() {
                if (confirm('ATENÇÃO: Você tem certeza que deseja excluir TODOS os registros? Esta ação não pode ser desfeita!')) {
                    localStorage.removeItem('noemi_confirmations');
                    searchQuery = '';
                    searchInput.value = '';
                    render();
                }
            };

            window.refreshData = function() {
                const btn = document.querySelector('.fa-rotate').parentElement;
                btn.classList.add('rotate-180');
                render();
                setTimeout(() => btn.classList.remove('rotate-180'), 300);
            };

            window.exportToCSV = function() {
                const records = loadedRecords;
                if (records.length === 0) {
                    alert('Não há dados para exportar.');
                    return;
                }
                
                const csvData = records.map(r => ({
                    'Convidado(s)': r.names.join(', '),
                    'Quantidade Pessoas': r.isGoing ? r.headcount : 0,
                    'Status': r.isGoing ? 'Confirmado' : 'Não vai',
                    'Data e Hora do Registro': new Date(r.timestamp).toLocaleString('pt-BR')
                }));

                const csv = Papa.unparse(csvData);
                const blob = new Blob(["\ufeff"+csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "confirmacoes_noemi.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            // GERENCIAMENTO DA LISTA DE CONVIDADOS (Aba 2)
            const guestsTableBody = document.getElementById('guests-table-body');
            
            async function renderGuests() {
                if (!supabase) return;
                guestsTableBody.innerHTML = '<tr><td colspan="2" class="py-8 text-center text-gray-400"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></td></tr>';
                
                const { data, error } = await supabase.from('allowed_guests').select('*').order('name', { ascending: true });
                if (error || !data || data.length === 0) {
                    guestsTableBody.innerHTML = '<tr><td colspan="2" class="py-8 text-center text-gray-400 font-semibold">Nenhum convidado na lista.</td></tr>';
                    return;
                }

                guestsTableBody.innerHTML = data.map(g => `
                    <tr class="hover:bg-gray-50/50 transition-colors group">
                        <td class="py-3 pl-6 pr-4">
                            <span class="font-bold text-gray-700">${g.name}</span>
                        </td>
                        <td class="py-3 px-4 text-center">
                            <button onclick="deleteGuest('${g.id}')" class="text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }

            window.addGuest = async function() {
                const input = document.getElementById('new-guest-name');
                const name = input.value.trim();
                if (!name) return;

                input.disabled = true;
                const { error } = await supabase.from('allowed_guests').insert([{ name }]);
                input.disabled = false;
                
                if (!error) {
                    input.value = '';
                    renderGuests();
                } else {
                    alert('Erro ao adicionar convidado.');
                }
            };

            window.deleteGuest = async function(id) {
                if (confirm('Tem certeza que deseja remover este nome da lista permitida?')) {
                    await supabase.from('allowed_guests').delete().eq('id', id);
                    renderGuests();
                }
            };

            // Expõe pro escopo global o renderGuests pra as tabs
            window.renderGuests = renderGuests;

            // Init
            render();

            // Auto-refresh sutil
            setInterval(() => {
                if(!searchQuery) render(); // só atualiza sozinho se não estiver buscando
            }, 10000);
        })();
    