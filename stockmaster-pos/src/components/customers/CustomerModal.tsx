import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Customer } from '../../types';
import { usePosStore } from '../../store/posStore';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
}) => {
  const { settings } = usePosStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nisNif, setNisNif] = useState('');
  const [creditLimit, setCreditLimit] = useState('50000');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setNisNif(customer.nis_nif || '');
      setCreditLimit(customer.credit_limit.toString());
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNisNif('');
      setCreditLimit('50000');
    }
  }, [customer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Le nom du client est requis !');

    onSave({
      id: customer?.id || '',
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      nis_nif: nisNif.trim() || null,
      credit_limit: parseFloat(creditLimit) || 0,
      current_debt: customer?.current_debt || 0,
      created_at: customer?.created_at || new Date().toISOString(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Modifier Fiche Client' : 'Nouveau Client'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom / Raison Sociale"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Établissement Benali & Frères"
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0550 00 00 00"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@domaine.dz"
          />
        </div>

        <Input
          label="Adresse"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adresse ou Zone industrielle..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="NIF / NIS / RC (Fiscalité)"
            value={nisNif}
            onChange={(e) => setNisNif(e.target.value)}
            placeholder="NIF: 000000000000000"
          />
          <Input
            label="Plafond de Crédit Autorisé"
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            suffixText={settings.currency}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-lg shadow-emerald-950 transition"
          >
            Enregistrer Client
          </button>
        </div>
      </form>
    </Modal>
  );
};
