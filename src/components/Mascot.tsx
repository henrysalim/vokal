import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

export default function VokalMascot({ size = 120 }: { size?: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <View style={{ width: size, height: size * 0.85, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[animatedStyle, { width: '100%', height: '100%' }]}>
        <Svg viewBox="0 0 200 170" width="100%" height="100%">
          {/* Left sound waves */}
          <G origin="55, 85">
            <Path d="M52 55 Q32 85 52 115" stroke="#C1592E" strokeWidth="7" strokeLinecap="round" fill="none" />
            <Path d="M42 45 Q14 85 42 125" stroke="#74822F" strokeWidth="7" strokeLinecap="round" fill="none" />
            <Path d="M32 35 Q-4 85 32 135" stroke="#E8A33D" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.6" />
          </G>

          {/* Right sound waves */}
          <G origin="145, 85">
            <Path d="M148 55 Q168 85 148 115" stroke="#C1592E" strokeWidth="7" strokeLinecap="round" fill="none" />
            <Path d="M158 45 Q186 85 158 125" stroke="#74822F" strokeWidth="7" strokeLinecap="round" fill="none" />
            <Path d="M168 35 Q204 85 168 135" stroke="#E8A33D" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.6" />
          </G>

          {/* Shield body */}
          <Path
            d="M100 18 L148 38 L148 88 C148 118 126 140 100 152 C74 140 52 118 52 88 L52 38 Z"
            fill="#E8A33D"
          />
          {/* Shield shadow/highlight */}
          <Path
            d="M100 18 L100 152 C74 140 52 118 52 88 L52 38 Z"
            fill="rgba(62,46,34,0.08)"
          />
          {/* Shield outline */}
          <Path
            d="M100 18 L148 38 L148 88 C148 118 126 140 100 152 C74 140 52 118 52 88 L52 38 Z"
            stroke="#3E2E22" strokeWidth="5" fill="none" strokeLinejoin="round"
          />

          {/* Eyes */}
          <G origin="85, 82">
            <Circle cx="85" cy="82" r="6" fill="#3E2E22" />
            <Circle cx="115" cy="82" r="6" fill="#3E2E22" />
          </G>
          {/* Eye glints */}
          <Circle cx="87" cy="80" r="2" fill="white" />
          <Circle cx="117" cy="80" r="2" fill="white" />

          {/* Smile */}
          <Path d="M88 100 Q100 114 112 100" stroke="#3E2E22" strokeWidth="4.5" strokeLinecap="round" fill="none" />

          {/* Cheek blush */}
          <Circle cx="76" cy="95" r="7" fill="#C1592E" opacity="0.25" />
          <Circle cx="124" cy="95" r="7" fill="#C1592E" opacity="0.25" />
        </Svg>
      </Animated.View>
    </View>
  );
}
