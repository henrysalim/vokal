import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { AlertTriangle, CheckCircle2, Info, HelpCircle, X, Share2, ShieldAlert } from 'lucide-react-native';
import { AppText } from './AppText';

export type ConfirmVariant = 'mustard' | 'terracotta' | 'olive' | 'espresso' | 'info';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  iconType?: 'info' | 'success' | 'warning' | 'danger' | 'share' | 'question';
  onConfirm?: () => void;
  onCancel?: () => void;
};

type ConfirmContextType = {
  showConfirm: (options: ConfirmOptions) => void;
  hideConfirm: () => void;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

const VARIANT_CONFIGS: Record<ConfirmVariant, { btnBg: string; btnBorder: string; btnText: string; iconBg: string; iconColor: string }> = {
  mustard: {
    btnBg: 'bg-mustard',
    btnBorder: 'border-[#d49232]',
    btnText: 'text-espresso',
    iconBg: 'bg-mustard/20',
    iconColor: '#E8A33D',
  },
  terracotta: {
    btnBg: 'bg-terracotta',
    btnBorder: 'border-[#A3431D]',
    btnText: 'text-white',
    iconBg: 'bg-terracotta/20',
    iconColor: '#C1592E',
  },
  olive: {
    btnBg: 'bg-olive',
    btnBorder: 'border-[#5c6823]',
    btnText: 'text-white',
    iconBg: 'bg-olive/20',
    iconColor: '#74822F',
  },
  espresso: {
    btnBg: 'bg-espresso',
    btnBorder: 'border-[#2A1F17]',
    btnText: 'text-cream',
    iconBg: 'bg-espresso/20',
    iconColor: '#3E2E22',
  },
  info: {
    btnBg: 'bg-mustard',
    btnBorder: 'border-[#d49232]',
    btnText: 'text-espresso',
    iconBg: 'bg-mustard/20',
    iconColor: '#E8A33D',
  },
};

export function ConfirmModalComponent({
  visible,
  options,
  onClose,
}: {
  visible: boolean;
  options: ConfirmOptions | null;
  onClose: () => void;
}) {
  if (!visible || !options) return null;

  const {
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    variant = 'mustard',
    iconType = 'question',
    onConfirm,
    onCancel,
  } = options;

  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.mustard;

  const handleConfirm = () => {
    onClose();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    onClose();
    if (onCancel) onCancel();
  };

  const renderIcon = () => {
    switch (iconType) {
      case 'share':
        return <Share2 color={config.iconColor} size={28} />;
      case 'danger':
      case 'warning':
        return <ShieldAlert color={config.iconColor} size={28} />;
      case 'success':
        return <CheckCircle2 color={config.iconColor} size={28} />;
      case 'info':
        return <Info color={config.iconColor} size={28} />;
      case 'question':
      default:
        return <HelpCircle color={config.iconColor} size={28} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleCancel}>
      <View className="flex-1 bg-espresso/80 justify-center items-center px-5">
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          className="absolute inset-0"
        >
          <TouchableOpacity className="w-full h-full" activeOpacity={1} onPress={handleCancel} />
        </Animated.View>

        <Animated.View
          entering={ZoomIn.duration(200).springify()}
          exiting={ZoomOut.duration(150)}
          className="bg-cream w-full rounded-[32px] overflow-hidden p-6 shadow-2xl border border-espresso/10 max-w-sm max-h-[85%]"
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* TOP CLOSE BUTTON */}
            <View className="items-end -mr-2 -mt-2">
              <TouchableOpacity
                onPress={handleCancel}
                className="w-8 h-8 rounded-full bg-espresso/5 items-center justify-center"
              >
                <X color="#3E2E22" size={16} opacity={0.6} />
              </TouchableOpacity>
            </View>

            {/* ICON & TITLE */}
            <View className="items-center mb-5">
              <View className={`w-16 h-16 rounded-full ${config.iconBg} items-center justify-center mb-4`}>
                {renderIcon()}
              </View>

              <AppText size="xl" className="font-heading text-espresso text-center leading-tight">
                {title}
              </AppText>

              <AppText size="xs" className="font-body text-text-muted text-center mt-2 px-2 leading-relaxed">
                {message}
              </AppText>
            </View>

            {/* BUTTON ACTIONS */}
            <View className="gap-2.5 mt-2">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirm}
                className={`w-full ${config.btnBg} py-3.5 rounded-2xl items-center border-b-4 ${config.btnBorder} shadow-sm`}
              >
                <AppText size="sm" className={`font-heading ${config.btnText}`}>
                  {confirmText}
                </AppText>
              </TouchableOpacity>

              {cancelText ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCancel}
                  className="w-full bg-surface py-3 rounded-2xl items-center border border-espresso/10"
                >
                  <AppText size="xs" className="font-heading text-espresso/70">
                    {cancelText}
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    visible: boolean;
    options: ConfirmOptions | null;
  }>({
    visible: false,
    options: null,
  });

  const showConfirm = (options: ConfirmOptions) => {
    setModalState({
      visible: true,
      options,
    });
  };

  const hideConfirm = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm, hideConfirm }}>
      {children}
      <ConfirmModalComponent
        visible={modalState.visible}
        options={modalState.options}
        onClose={hideConfirm}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirmModal() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  }
  return context;
}
