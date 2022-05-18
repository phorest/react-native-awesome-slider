import { Bubble, BubbleRef } from './ballon';
import { palette } from './theme/palette';
import { clamp } from './utils';
import React, { FC, useRef, useState } from 'react';
import {
  Insets,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const formatSeconds = (second: number) => `${Math.round(second * 100) / 100}`;
const hitSlop = {
  top: 12,
  bottom: 12,
};
export enum HapticModeEnum {
  NONE = 'none',
  STEP = 'step',
  BOTH = 'both',
}
export enum PanDirectionEnum {
  START = 0,
  LEFT = 1,
  RIGHT = 2,
  END = 3,
}
export type SliderThemeType =
  | {
  /**
   * Color to fill the progress in the seekbar
   */
  minimumTrackTintColor?: string;
  /**
   * Color to fill the background in the seekbar
   */
  maximumTrackTintColor?: string;
  /**
   * Color to fill the cache in the seekbar
   */
  cacheTrackTintColor?: string;
  /**
   * Color to fill the bubble backgrouundColor
   */
  bubbleBackgroundColor?: string;
  /**
   * Bubble text color
   */
  bubbleTextColor?: string;
  /**
   * Disabled color to fill the progress in the seekbar
   */
  disableMinTrackTintColor?: string;
}
  | null
  | undefined;

export type AwesomeSliderProps = {
  /**
   * Style for the container view
   */
  style?: StyleProp<ViewStyle>;

  sliderHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * A function that gets the current value of the slider as you slide it,
   * and returns a string to be used inside the bubble. if not provided it will use the
   * current value as integer.
   */
  bubble?: (s: number) => string;

  /**
   * An Animated.SharedValue from `react-native-reanimated` library which is the
   * current value of the slider.
   */
  progress: Animated.SharedValue<number>;

  /**
   * A Animated.SharedValue from `react-native-reanimated` library which is the
   * curren value of the cache. the cache is optional and will be rendered behind
   * the main progress indicator.
   */
  cache?: Animated.SharedValue<number>;

  /**
   * An  Animated.SharedValue from `react-native-reanimated` library which is the minimum value of the slider.
   */
  minimumValue: Animated.SharedValue<number>;

  /**
   * An Animated.SharedValue from `react-native-reanimated` library which is themaximum value of the slider.
   */
  maximumValue: Animated.SharedValue<number>;

  /**
   * Callback called when the users starts sliding
   */
  onSlidingStart?: () => void;

  /**
   * Callback called when slide value change
   */
  onValueChange?: (value: number) => void;

  /**
   * Callback called when the users stops sliding. the new value will be passed as argument
   */
  onSlidingComplete?: (value: number) => void;

  /**
   * Render custom Bubble to show when sliding.
   */
  renderBubble?: () => React.ReactNode;

  /**
   * This function will be called while sliding, and should set the text inside your custom bubble.
   */
  setBubbleText?: (s: string) => void;

  /**
   * Value to pass to the container of the bubble as `translateY`
   */
  bubbleTranslateY?: number;

  /**
   * Render custom thumb image. if you need to customize thumb, you also need to set the `thumb width`
   */
  renderThumb?: () => React.ReactNode;

  /**
   * Render custom label. if you need to customize thumb, you also need to set the `thumb width`
   */
  labelTextForIndex?: (labelIndex: number) => string;

  labelStyle?: StyleProp<TextStyle>;

  labelOffset?: number;

  /**
   * Thumb elements width, default 15
   */
  thumbWidth?: number;
  /**
   * Disable slider
   */
  disable?: boolean;

  /**
   * Enable tap event change value, default true
   */
  disableTapEvent?: boolean;
  /**
   * Bubble elements max width, default 100.
   */
  bubbleMaxWidth?: number;
  bubbleTextStyle?: StyleProp<TextStyle>;
  bubbleContainerStyle?: StyleProp<ViewStyle>;

  /**
   * By this, you know the slider status as quickly as possible.(This is useful when you doing video-palyer’s scrubber.)
   */
  isScrubbing?: Animated.SharedValue<boolean>;
  /**
   * On tap slider event.(This is useful when you doing video-palyer’s scrubber.)
   */
  onTap?: () => void;
  /**
   * By this, you can control thumb’s transform-scale animation.
   */
  thumbScaleValue?: Animated.SharedValue<number>;
  panHitSlop?: Insets;

  step?: number;
  /**
   * withTiming options when step is defined. if false, no animation will be used. default false.
   */
  stepTimingOptions?: false | Animated.WithTimingConfig;
  markStyle?: StyleProp<ViewStyle>;
  markWidth?: number;
  onHapticFeedback?: () => void;
  hapticMode?: `${HapticModeEnum}`;
  theme?: SliderThemeType;
  /**
   * Current swipe direction
   * @enum Animated.SharedValue<PanDirectionEnum>
   */
  panDirectionValue?: Animated.SharedValue<PanDirectionEnum>;
  /**
   * Disable track follow thumb.(Commonly used in video/audio players)
   */
  disableTrackFollow?: boolean;
  /**
   * Bubble width, If you set this value, bubble positioning left & right will be clamp.
   */
  bubbleWidth?: number;
  testID?: string;
};
const defaultTheme: SliderThemeType = {
  minimumTrackTintColor: palette.Main,
  maximumTrackTintColor: palette.Gray,
  cacheTrackTintColor: palette.Gray,
  bubbleBackgroundColor: palette.Main,
  bubbleTextColor: palette.White,
};
export const Slider: FC<AwesomeSliderProps> = ({
                                                 bubble,
                                                 bubbleContainerStyle,
                                                 bubbleMaxWidth = 100,
                                                 bubbleTextStyle,
                                                 bubbleTranslateY = -25,
                                                 bubbleWidth = 0,
                                                 cache,
                                                 containerStyle,
                                                 disable = false,
                                                 disableTapEvent = false,
                                                 disableTrackFollow = false,
                                                 hapticMode = 'none',
                                                 isScrubbing,
                                                 markStyle,
                                                 markWidth = 4,
                                                 maximumValue,
                                                 minimumValue,
                                                 onHapticFeedback,
                                                 onSlidingComplete,
                                                 onSlidingStart,
                                                 onTap,
                                                 onValueChange,
                                                 panDirectionValue,
                                                 panHitSlop = hitSlop,
                                                 progress,
                                                 renderBubble,
                                                 renderThumb,
                                                 setBubbleText,
                                                 sliderHeight = 5,
                                                 step,
                                                 stepTimingOptions = false,
                                                 style,
                                                 testID,
                                                 theme,
                                                 thumbScaleValue,
                                                 thumbWidth = 15,
                                                 labelTextForIndex,
                                                 labelStyle,
                                                 labelOffset = 0,
                                               }) => {
  const bubbleRef = useRef<BubbleRef>(null);
  const prevX = useSharedValue(0);

  const [sliderWidth, setSliderWidth] = useState(0);
  const width = useSharedValue(0);
  const thumbValue = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);
  const markLeftArr = useSharedValue<number[]>([]);
  const thumbIndex = useSharedValue(0);
  const isTriggedHaptic = useSharedValue(false);
  const _theme = {
    ...defaultTheme,
    ...theme,
  };

  const getMarkStyles = () => {
    const animatedMarks = [];
    for (let index = 0; index < (step ?? 0) + 1; index++) {
      animatedMarks.push({
        ...(markStyle as any),
        backgroundColor:
          progress.value >= index
            ? theme?.minimumTrackTintColor
            : theme?.maximumTrackTintColor,
      });
    }
    return animatedMarks;
  };

  const [markStyles, setMarkStyles] = useState(getMarkStyles());

  const sliderTotalValue = () => {
    'worklet';
    return maximumValue.value + minimumValue.value;
  };

  const progressToValue = (value: number) => {
    'worklet';
    if (sliderTotalValue() === 0) {
      return 0;
    }
    return (value / sliderTotalValue()) * width.value;
  };

  const animatedSeekStyle = useAnimatedStyle(() => {
    let seekWidth = 0;
    // when you set step

    seekWidth = progressToValue(progress.value) + thumbWidth / 2;

    return {
      width: clamp(seekWidth, 0, width.value),
    };
  }, [progress, minimumValue, maximumValue, width, markLeftArr]);

  const animatedThumbStyle = useAnimatedStyle(() => {
    let translateX = 0;
    // when you set step
    if (disableTrackFollow) {
      translateX = clamp(thumbValue.value, 0, width.value - thumbWidth);
    } else {
      translateX = clamp(
        progressToValue(progress.value) - thumbWidth,
        -thumbWidth / 2,
        width.value - thumbWidth,
      );
    }
    return {
      transform: [
        {
          translateX,
        },
        {
          scale: withTiming(thumbScaleValue ? thumbScaleValue.value : 1, {
            duration: 100,
          }),
        },
      ],
    };
  }, [progress, minimumValue, maximumValue, width.value]);

  const animatedBubbleStyle = useAnimatedStyle(() => {
    let translateX = 0;
    // when you set step
    if (step && markLeftArr.value.length >= step) {
      translateX = markLeftArr.value[thumbIndex.value] + thumbWidth / 2;
    } else {
      translateX = thumbValue.value + thumbWidth / 2;
    }
    return {
      opacity: bubbleOpacity.value,
      transform: [
        {
          translateY: bubbleTranslateY,
        },
        {
          translateX:
            step && stepTimingOptions
              ? withTiming(
                clamp(
                  translateX,
                  bubbleWidth / 2,
                  width.value - bubbleWidth / 2,
                ),
                stepTimingOptions,
              )
              : clamp(
                translateX,
                bubbleWidth / 2,
                width.value - bubbleWidth / 2,
              ),
        },
        {
          scale: bubbleOpacity.value,
        },
      ],
    };
  });

  const animatedCacheXStyle = useAnimatedStyle(() => {
    const cacheX = cache?.value
      ? (cache?.value / sliderTotalValue()) * width.value
      : 0;

    return {
      width: cacheX,
    };
  });

  const onSlideAcitve = (seconds: number) => {
    const bubbleText = bubble ? bubble?.(seconds) : formatSeconds(seconds);
    onValueChange?.(seconds);

    setBubbleText
      ? setBubbleText(bubbleText)
      : bubbleRef.current?.setText(bubbleText);
  };

  /**
   * convert Sharevalue to callback seconds
   * @returns number
   */
  const shareValueToSeconds = () => {
    'worklet';

    const sliderPercent = clamp(
      thumbValue.value / (width.value - thumbWidth) +
      minimumValue.value / sliderTotalValue(),
      0,
      1,
    );
    return clamp(
      sliderPercent * sliderTotalValue(),
      minimumValue.value,
      maximumValue.value,
    );
  };
  /**
   * convert [x] position to progress
   * @returns number
   */
  const xToProgress = (x: number) => {
    'worklet';
    if (step && markLeftArr.value.length >= step) {
      return markLeftArr.value[thumbIndex.value];
    } else {
      return (x / (width.value - thumbWidth)) * sliderTotalValue();
    }
  };

  /**
   * change slide value
   */
  const onActiveSlider = (x: number) => {
    'worklet';
    if (isScrubbing) {
      isScrubbing.value = true;
    }

    thumbValue.value = clamp(x, 0, width.value - thumbWidth);
    if (!disableTrackFollow) {
      progress.value = xToProgress(x);
    }
    // Determines whether the thumb slides to both ends
    if (x <= 0 || x >= width.value - thumbWidth) {
      if (
        !isTriggedHaptic.value &&
        hapticMode === HapticModeEnum.BOTH &&
        onHapticFeedback
      ) {
        runOnJS(onHapticFeedback)();
        isTriggedHaptic.value = true;
      }
    } else {
      isTriggedHaptic.value = false;
    }
    runOnJS(onSlideAcitve)(shareValueToSeconds());
    runOnJS(setMarkStyles)(getMarkStyles());
  };

  const onGestureEvent = Gesture.Pan()
    .hitSlop(panHitSlop)
    .onStart(() => {
      // e.absoluteX
      if (disable) {
        return;
      }
      if (isScrubbing) {
        isScrubbing.value = true;
      }
      // ctx.isTriggedHaptic = false;
      if (panDirectionValue) {
        panDirectionValue.value = PanDirectionEnum.START;
        prevX.value = 0;
      }
      if (onSlidingStart) {
        runOnJS(onSlidingStart)();
      }
    })
    .onUpdate(({ x }) => {
      if (disable) {
        return;
      }
      if (panDirectionValue) {
        panDirectionValue.value =
          prevX.value - x > 0 ? PanDirectionEnum.LEFT : PanDirectionEnum.RIGHT;
        prevX.value = x;
      }
      bubbleOpacity.value = withSpring(1);
      onActiveSlider(x);
    })
    .onEnd(({ x }) => {
      if (disable) {
        return;
      }
      if (isScrubbing) {
        isScrubbing.value = true;
      }
      if (panDirectionValue) {
        panDirectionValue.value = PanDirectionEnum.END;
      }
      bubbleOpacity.value = withSpring(0);

      if (disableTrackFollow) {
        progress.value = xToProgress(x);
      }
      if (progress.value % 1 !== 0) {
        const roundedValue = Math.round(progress.value);
        progress.value = roundedValue;
        if (onSlidingComplete) {
          runOnJS(onSlidingComplete)(roundedValue);
          runOnJS(setMarkStyles)(getMarkStyles());
        }
      } else if (onSlidingComplete) {
        runOnJS(onSlidingComplete)(shareValueToSeconds());
      }
    });
  const onSingleTapEvent = Gesture.Tap()
    .hitSlop(panHitSlop)
    .onEnd(({ x }, isFinished) => {
      if (onTap) {
        runOnJS(onTap)();
      }
      if (disable || disableTapEvent) {
        return;
      }
      if (isFinished) {
        onActiveSlider(x);
      }
      if (isScrubbing) {
        isScrubbing.value = true;
      }
      bubbleOpacity.value = withSpring(0);
      if (progress.value % 1 !== 0) {
        const roundedValue = Math.round(progress.value);
        progress.value = roundedValue;
        if (onSlidingComplete) {
          runOnJS(onSlidingComplete)(roundedValue);
          runOnJS(setMarkStyles)(getMarkStyles());
        }
      } else if (onSlidingComplete) {
        runOnJS(onSlidingComplete)(shareValueToSeconds());
      }
    });

  const gesture = Gesture.Race(onSingleTapEvent, onGestureEvent);

  // setting markLeftArr
  useAnimatedReaction(
    () => {
      if (!step) {
        return [];
      }
      return new Array(step + 1).fill(0).map((_, i) => {
        return (
          Math.round(width.value * (i / step)) -
          (i / step) * markWidth -
          Math.round(thumbWidth / 3)
        );
      });
    },
    data => {
      markLeftArr.value = data;
    },
    [thumbWidth, markWidth, step, progress, width],
  );

  // setting thumbIndex
  useAnimatedReaction(
    () => {
      if (isScrubbing && isScrubbing.value) {
        return undefined;
      }
      if (!step) {
        return undefined;
      }
      const marksLeft = new Array(step + 1)
        .fill(0)
        .map((_, i) => Math.round(width.value * (i / step)));

      // current positon width
      const currentWidth = Math.round(
        ((progress.value - minimumValue.value) /
          (maximumValue.value - minimumValue.value)) *
        width.value,
      );

      const currentIndex = marksLeft.findIndex(value => value >= currentWidth);
      return clamp(currentIndex, 0, step);
    },
    data => {
      if (data !== undefined) {
        thumbIndex.value = data;
      }
    },
    [isScrubbing, maximumValue, minimumValue, step, progress, width],
  );

  // setting thumbValue
  useAnimatedReaction(
    () => {
      if (isScrubbing && isScrubbing.value) {
        return undefined;
      }
      if (step) {
        return undefined;
      }
      const currentValue =
        (progress.value / (minimumValue.value + maximumValue.value)) *
        width.value;
      return clamp(currentValue, 0, width.value - thumbWidth);
    },
    data => {
      if (data !== undefined) {
        thumbValue.value = data;
      }
    },
    [thumbWidth, maximumValue, minimumValue, step, progress, width],
  );

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const layoutWidth = nativeEvent.layout.width;
    width.value = layoutWidth;
    setSliderWidth(layoutWidth);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        testID={testID}
        style={[styles.view, { height: sliderHeight }, style]}
        hitSlop={panHitSlop}
        onLayout={onLayout}>
        <Animated.View
          style={StyleSheet.flatten([
            styles.slider,
            {
              height: sliderHeight,
              backgroundColor: _theme.maximumTrackTintColor,
            },
            containerStyle,
          ])}>
          <Animated.View
            style={[
              styles.cache,
              {
                backgroundColor: _theme.cacheTrackTintColor,
              },
              animatedCacheXStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.seek,
              {
                backgroundColor: disable
                  ? _theme.disableMinTrackTintColor
                  : _theme.minimumTrackTintColor,
              },
              animatedSeekStyle,
            ]}
          />
        </Animated.View>
        {sliderWidth > 0 &&
          step &&
          new Array(step + 1).fill(0).map((_, i) => {
            const left = sliderWidth * (i / step) - (i / step) * markWidth;
            return (
              <>
                <View
                  key={i}
                  style={[
                    styles.mark,
                    {
                      width: markWidth,
                      left,
                    },
                    markStyles.length > i ? markStyles[i] : {},
                  ]}
                />
                {labelTextForIndex && labelTextForIndex(i) && (
                  <Text
                    style={[
                      ,
                      { left: left + labelOffset },
                      styles.label,
                      labelStyle,
                    ]}>
                    {labelTextForIndex(i)}
                  </Text>
                )}
              </>
            );
          })}
        <Animated.View style={[styles.thumb, animatedThumbStyle]}>
          {renderThumb ? (
            renderThumb()
          ) : (
            <View
              style={{
                backgroundColor: _theme.minimumTrackTintColor,
                height: thumbWidth,
                width: thumbWidth,
                borderRadius: thumbWidth,
              }}
            />
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.bubble,
            {
              left: -bubbleMaxWidth / 2,
              width: bubbleMaxWidth,
            },
            animatedBubbleStyle,
          ]}>
          {renderBubble ? (
            renderBubble()
          ) : (
            <Bubble
              ref={bubbleRef}
              color={_theme.bubbleBackgroundColor}
              textColor={_theme.bubbleTextColor}
              textStyle={bubbleTextStyle}
              containerStyle={bubbleContainerStyle}
              bubbleMaxWidth={bubbleMaxWidth}
            />
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};
const styles = StyleSheet.create({
  slider: {
    width: '100%',
    overflow: 'hidden',
  },
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cache: {
    height: '100%',
    left: 0,
    position: 'absolute',
  },
  seek: {
    height: '100%',
    maxWidth: '100%',
    left: 0,
    position: 'absolute',
  },
  mark: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#fff',
  },
  label: {
    position: 'absolute',
    top: 50,
    textAlign: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 0,
  },
  bubble: {
    position: 'absolute',
  },
});
