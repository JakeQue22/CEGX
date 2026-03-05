'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { EmailList } from '@/types';
import { Table, Column } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

export default function EmailListsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImport, setShowImport] = useState(false);
  const [listName, setListName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [emailColumn, setEmailColumn] = useState('');
  const [nameColumn, setNameColumn] = useState('');
  const [importError, setImportError] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<EmailList[]>({
    queryKey: ['email-lists'],
    queryFn: () => axiosInstance.get('/email-lists').then((r) =>
      Array.isArray(r.data) ? r.data : []),
  });

  const { data: selectedList, isLoading: listLoading } = useQuery<EmailList>({
    queryKey: ['email-list', selectedListId],
    queryFn: () => axiosInstance.get(`/email-lists/${selectedListId}`).then((r) => r.data),
    enabled: !!selectedListId,
  });

  const importList = useMutation({
    mutationFn: (payload: any) => axiosInstance.post('/email-lists/import', payload).then((r) => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['email-lists'] });
      setShowImport(false);
      resetImportForm();
      alert(`Imported ${result.imported} entries into "${result.name}"`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setImportError(Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : 'Import failed');
    },
  });

  const deleteList = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/email-lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-lists'] });
      if (selectedListId) setSelectedListId(null);
    },
  });

  function resetImportForm() {
    setListName('');
    setCsvHeaders([]);
    setCsvRows([]);
    setEmailColumn('');
    setNameColumn('');
    setImportError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0) {
        setImportError('Could not parse CSV file — ensure it has headers');
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-detect email column
      const emailCol = headers.find((h) => /email/i.test(h));
      if (emailCol) setEmailColumn(emailCol);
      const nameCol = headers.find((h) => /^name$/i.test(h) || /full.?name/i.test(h) || /first.?name/i.test(h));
      if (nameCol) setNameColumn(nameCol);
      if (!listName) setListName(file.name.replace(/\.csv$/i, ''));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!listName.trim()) { setImportError('List name is required'); return; }
    if (!emailColumn) { setImportError('Select the email column'); return; }
    if (csvRows.length === 0) { setImportError('No data rows found in CSV'); return; }
    importList.mutate({
      name: listName.trim(),
      columns: csvHeaders,
      emailColumn,
      nameColumn: nameColumn || undefined,
      rows: csvRows,
    });
  }

  const lists = data ?? [];

  const columns: Column<EmailList>[] = [
    { key: 'name', header: 'List Name', sortable: true, render: (l) => (
      <button onClick={() => setSelectedListId(l.id)} className="font-medium text-blue-600 hover:underline">{l.name}</button>
    )},
    { key: 'columns', header: 'Columns', render: (l) => (
      <span className="text-xs text-gray-500">{(l.columns as string[]).join(', ')}</span>
    )},
    { key: '_count', header: 'Entries', sortable: true, render: (l) => l._count?.entries ?? 0 },
    { key: 'createdAt', header: 'Created', sortable: true, render: (l) => new Date(l.createdAt).toLocaleDateString('en-GB') },
    { key: 'id', header: '', render: (l) => (
      <button
        onClick={(e) => { e.stopPropagation(); if (confirm('Delete this email list?')) deleteList.mutate(l.id); }}
        className="text-xs text-red-500 hover:text-red-700"
      >Delete</button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Lists</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage contact lists for email campaigns</p>
        </div>
        <button
          onClick={() => { setShowImport(!showImport); resetImportForm(); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import CSV
        </button>
      </div>

      {/* Import Form */}
      {showImport && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Import Email List from CSV</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. Q1 Prospects"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {csvHeaders.length > 0 && (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">
                    Found <strong>{csvHeaders.length}</strong> columns and <strong>{csvRows.length}</strong> rows
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {csvHeaders.map((h) => (
                      <Badge key={h} label={h} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={emailColumn}
                      onChange={(e) => setEmailColumn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select column...</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name Column (optional)</label>
                    <select
                      value={nameColumn}
                      onChange={(e) => setNameColumn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">None</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {csvRows.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Preview (first 5 rows):</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            {csvHeaders.map((h) => (
                              <th key={h} className={`px-2 py-1 text-left font-medium ${h === emailColumn ? 'text-blue-600 bg-blue-50' : h === nameColumn ? 'text-green-600 bg-green-50' : 'text-gray-600'}`}>
                                {h}
                                {h === emailColumn && ' 📧'}
                                {h === nameColumn && ' 👤'}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              {csvHeaders.map((h) => (
                                <td key={h} className="px-2 py-1 text-gray-700">{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {importError && (
              <p className="text-sm text-red-600">{importError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={!listName || !emailColumn || csvRows.length === 0 || importList.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {importList.isPending ? 'Importing...' : `Import ${csvRows.length} Contacts`}
              </button>
              <button
                onClick={() => { setShowImport(false); resetImportForm(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Detail View */}
      {selectedListId && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{selectedList?.name ?? 'Loading...'}</h2>
            <button onClick={() => setSelectedListId(null)} className="text-sm text-gray-500 hover:text-gray-700">✕ Close</button>
          </div>
          {listLoading ? <LoadingSpinner /> : selectedList?.entries && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-gray-600">Email</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600">Name</th>
                    {(selectedList.columns as string[]).filter((c) => !/^email$/i.test(c) && !/^name$/i.test(c)).map((c) => (
                      <th key={c} className="px-2 py-1 text-left font-medium text-gray-600">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedList.entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-100">
                      <td className="px-2 py-1 text-gray-700">{entry.email}</td>
                      <td className="px-2 py-1 text-gray-700">{entry.name || '—'}</td>
                      {(selectedList.columns as string[]).filter((c) => !/^email$/i.test(c) && !/^name$/i.test(c)).map((c) => (
                        <td key={c} className="px-2 py-1 text-gray-700">{(entry.data as Record<string, string>)?.[c] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-2">{selectedList.entries.length} entries</p>
            </div>
          )}
        </div>
      )}

      {/* Lists Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={lists}
          rowKey={(l) => l.id}
          emptyMessage="No email lists yet. Import a CSV to get started."
        />
      )}
    </div>
  );
}
