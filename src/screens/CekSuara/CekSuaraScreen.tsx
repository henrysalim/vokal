import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, withDelay, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function CekSuaraScreen() {
  const pulse = useSharedValue(1);
  const scanProgress = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Simulate scan progress (Demo data)
    scanProgress.value = withDelay(1000, withTiming(85, { duration: 2500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedPulse = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value }));
  const animatedBar = useAnimatedStyle(() => ({ width: `${scanProgress.value}%` }));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream items-center justify-center p-6">
      
      <View className="items-center mb-16">
        <View className="relative items-center justify-center">
          <Animated.View className="absolute w-40 h-40 rounded-full border border-mustard/30 bg-mustard/10" style={animatedPulse} />
          <Animated.View className="absolute w-56 h-56 rounded-full border border-mustard/10 bg-mustard/5" style={[animatedPulse, { animationDelay: '200ms' }]} />
          
          <TouchableOpacity activeOpacity={0.8} className="w-28 h-28 rounded-full items-center justify-center shadow-lg" style={{ elevation: 5, shadowColor: '#E8A33D', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16 }}>
            <LinearGradient colors={['#E8A33D', '#C1592E']} className="w-full h-full rounded-full items-center justify-center">
              <Mic color="#FFFFFF" size={48} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text className="mt-12 text-espresso text-xl font-heading text-center">Tekan untuk Merekam</Text>
        <Text className="mt-2 text-text-muted text-sm font-body text-center px-4">Dekatkan hp ke sumber suara (telepon/audio) yang mencurigakan.</Text>
      </View>

      {/* RISK METER - MOCKUP */}
      <View className="w-full bg-surface rounded-[24px] p-5 shadow-sm border border-espresso/5" style={{ elevation: 1 }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-heading text-espresso">Status Suara Terakhir</Text>
          <View className="bg-warning/10 px-2 py-1 rounded-full border border-warning/20">
            <Text className="text-warning text-[10px] font-display">Simulasi - Data Contoh</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 mb-2">
          <ShieldAlert color="#7A2E28" size={24} />
          <Text className="text-3xl font-display text-warning">85%</Text>
          <Text className="text-warning text-xs font-body leading-tight mt-1">Kemungkinan{'\n'}Sintetis (AI)</Text>
        </View>

        <View className="w-full h-3 bg-espresso/5 rounded-full overflow-hidden mb-2 mt-2 flex-row">
          <LinearGradient colors={['#74822F', '#E8A33D', '#7A2E28']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} className="absolute inset-0" />
          <View className="absolute right-0 bottom-0 top-0 bg-espresso/10" style={{ width: '15%' }} />
          <View className="absolute bg-surface w-[3px] h-full" style={{ left: '85%' }} />
        </View>
        
        <View className="flex-row justify-between">
          <Text className="text-olive text-[10px] font-display">Aman</Text>
          <Text className="text-warning text-[10px] font-display">Berbahaya</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}
