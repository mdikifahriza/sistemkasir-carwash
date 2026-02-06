'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useOfflineUsers } from '@/lib/hooks/useOffline';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface EmployeeSplitProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EmployeeSplit({ isOpen, onClose }: EmployeeSplitProps) {
    const { employeeSplits, setEmployeeSplits } = useCartStore();
    const { users } = useOfflineUsers();
    const { userId: currentUserId } = useAuthStore();

    // Filter hanya karyawan yang aktif dan relevan (kasir/manager)
    const activeEmployees = users.filter(u => u.is_active && ['cashier', 'manager', 'owner'].includes(u.role));

    const [splits, setSplits] = useState<{ userId: string; percentage: number }[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (employeeSplits.length > 0) {
                setSplits([...employeeSplits]);
            } else if (currentUserId) {
                // Default to current user 100%
                setSplits([{ userId: currentUserId, percentage: 100 }]);
            }
        }
    }, [isOpen, employeeSplits, currentUserId]);

    const totalPercentage = splits.reduce((sum, item) => sum + item.percentage, 0);

    const handleAdd = () => {
        const remaining = Math.max(0, 100 - totalPercentage);
        // Add placeholder
        setSplits([...splits, { userId: '', percentage: remaining }]);
    };

    const handleRemove = (index: number) => {
        const newSplits = [...splits];
        newSplits.splice(index, 1);
        setSplits(newSplits);
    };

    const handleUpdate = (index: number, field: 'userId' | 'percentage', value: string | number) => {
        const newSplits = [...splits];
        newSplits[index] = { ...newSplits[index], [field]: value };
        setSplits(newSplits);
    };

    const handleSave = () => {
        if (totalPercentage !== 100) {
            alert('Total persentase harus 100%');
            return;
        }
        if (splits.some(s => !s.userId)) {
            alert('Pilih karyawan untuk semua baris');
            return;
        }
        setEmployeeSplits(splits);
        onClose();
    };

    // Helper untuk mendapatkan nama user
    const getUserName = (id: string) => {
        return activeEmployees.find(u => u.id === id)?.full_name || 'Unknown';
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Pembagian Komisi Karyawan"
            size="md"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-surface-2 p-3 rounded-lg">
                    <span className="text-sm font-medium text-ink-muted">Total Alokasi</span>
                    <Badge variant={totalPercentage === 100 ? 'success' : 'danger'}>
                        {totalPercentage}%
                    </Badge>
                </div>

                <div className="space-y-3">
                    {splits.map((split, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <div className="flex-1">
                                <Select
                                    value={split.userId}
                                    onChange={(e) => handleUpdate(index, 'userId', e.target.value)}
                                >
                                    <option value="" disabled>Pilih Karyawan</option>
                                    {activeEmployees.map(emp => (
                                        <option
                                            key={emp.id}
                                            value={emp.id}
                                            disabled={splits.some((s, i) => i !== index && s.userId === emp.id)}
                                        >
                                            {emp.full_name} ({emp.employee_id})
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="w-20 relative">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={split.percentage}
                                    onChange={(e) => handleUpdate(index, 'percentage', Number(e.target.value))}
                                    className="pr-6"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted">%</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(index)}
                                className="text-red-500 hover:bg-red-50 p-2"
                                disabled={splits.length === 1}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={handleAdd}
                    disabled={totalPercentage >= 100 || activeEmployees.length <= splits.length}
                >
                    <Plus size={16} className="mr-2" /> Tambah Karyawan
                </Button>

                <div className="pt-4 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleSave}
                        disabled={totalPercentage !== 100}
                    >
                        Simpan Perubahan
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
