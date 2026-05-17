import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Ruler, Info, Link2, Wallet,
  ShoppingBag, Gem, Crown, Watch, Minus
} from 'lucide-react';
import { getSizeGuide } from '../../data/sizeGuideData';

const rowIconMap = {
  'Thắt lưng': Link2,
  'Ví': Wallet,
  'Túi xách': ShoppingBag,
  'Trang sức': Gem,
  'Đồng hồ': Watch,
  'Mũ': Crown,
};

const getRowIcon = (label) => {
  const Icon = rowIconMap[label];
  return Icon || Minus;
};

const isAccessories = (category) => {
  const cat = (category || '').toString().toLowerCase();
  return cat.includes('accessories') || cat.includes('phụ kiện');
};

const SizeGuideModal = ({ isOpen, onClose, category, gender }) => {
  const guide = getSizeGuide(category, gender);
  const accessoriesMode = isAccessories(category);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-2xl bg-white rounded-sm shadow-elevation overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-primary px-6 py-5 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-sm bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Ruler size={22} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-white leading-tight">
                    {guide.title}
                  </h2>
                  <p className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.15em] mt-0.5">
                    TIÊU CHUẨN SỐ ĐO NGƯỜI VIỆT
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-sm bg-white/10 hover:bg-white/20 transition-colors text-white shrink-0"
                aria-label="Đóng"
              >
                <X size={20} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {accessoriesMode ? (
                /* Accessories Card List */
                <div className="space-y-3">
                  {guide.rows.map((row, rowIdx) => {
                    const label = row[0];
                    const value = row[1];
                    const Icon = getRowIcon(label);
                    return (
                      <motion.div
                        key={rowIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: rowIdx * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-sm bg-surface-secondary border border-border hover:border-primary-200 hover:shadow-soft transition-all group"
                      >
                        <div className="w-10 h-10 rounded-sm bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                          <Icon size={18} className="text-primary" strokeWidth={2} />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 min-w-0">
                          <span className="font-bold text-foreground text-[15px]">{label}</span>
                          <span className="font-semibold text-primary text-[15px] text-center whitespace-nowrap">{value}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* Standard Table */
                <div className="overflow-x-auto rounded-sm border border-border shadow-soft">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border">
                        {guide.headers.map((header, idx) => (
                          <th
                            key={idx}
                            className="text-center py-3.5 px-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[15px]">
                      {guide.rows.map((row, rowIdx) => (
                        <motion.tr
                          key={rowIdx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: rowIdx * 0.03 }}
                          className="border-b border-border/50 last:border-b-0 hover:bg-primary-50/40 transition-colors"
                        >
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className={`py-3.5 px-5 text-center ${
                                cellIdx === 0
                                  ? 'font-bold text-primary'
                                  : 'text-foreground-secondary font-medium'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Note Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-4 rounded-sm bg-primary-50 flex items-start gap-2.5"
              >
                <div className="text-primary shrink-0 mt-0.5">
                  <Info size={20} strokeWidth={2.5} />
                </div>
                <p className="text-[14px] text-foreground-secondary leading-relaxed">
                  <span className="font-bold text-primary">Lưu ý:</span>{' '}
                  {guide.note || 'Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn nếu muốn mặc thoải mái.'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SizeGuideModal;