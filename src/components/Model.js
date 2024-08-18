import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const sounds = {
    cancel: new Audio('/vm-pr/gen_cancel.wav'),
    check: new Audio('/vm-pr/gen_check.wav'),
    emoji: new Audio('/vm-pr/gen_emoji.wav'),
};

export function Model({ setIsLoading, setMessage, resetPos, setResetPos, setAnimationComplete, selectedButton, setSelectedButton, setCursorStyle, ...props }) {
    const { nodes, materials } = useGLTF('/vm-pr/vending-machine.glb');
    const [triggerAnimation, setTriggerAnimation] = useState(false);
    const [animationProgress, setAnimationProgress] = useState(0);
    const [disableButtons, setDisableButtons] = useState(false);
    const [hoveredButton, setHoveredButton] = useState('');
    const [animateSelect, setAnimateSelect] = useState(false);
    const [animateOk, setAnimateOk] = useState(false);
    const [animateCancel, setAnimateCancel] = useState(false);

    const leftEyeRef = useRef();
    const rightEyeRef = useRef();
    const leftEyebrowRef = useRef();
    const rightEyebrowRef = useRef();
    const armsRef = useRef();

    // Wait for vending machine to load
    useEffect(() => {
        setIsLoading(false);
    }, [setIsLoading]);

    useEffect(() => {
        // Preload audio files
        Object.values(sounds).forEach(sound => {
            sound.preload = 'auto';
        });
    }, []);

    const playSound = (soundKey) => {
        const sound = sounds[soundKey];
        if (sound) {
            sound.currentTime = 0; 
            sound.play().catch(error => {
                console.error('Playback error:', error);
            });
        }
    };

    const eyebrowPositions = {
        left: [1.434, 6.716, 1.311],
        right: [1.448, 6.472, -0.452]
    };

    const armsPosition = [0.068, 3.418, 0]

    // Move eyes
    useFrame(({ mouse }) => {
        const moveFactorY = 0.5; // Adjust movement sensitivity along the y-axis
        const moveFactorZ = -0.5; // Adjust movement sensitivity along the z-axis

        const centerOffsetZ = -0.05; // X offset for both eyes
        const centerOffsetY = -0.3; // Y offset for both eyes

        const bounds = {
        y: [6.36, 6.6], // Min and max y offsets
        zLeft: [1.25, 1.11], // MAZ and MIN (reversed) z offsets for left glimmer
        zRight: [-0.38, -0.52], // Min and max z offsets for right glimmer
        };
    
        if (leftEyeRef.current) {
        const newY = centerOffsetY + 6.472 + mouse.y * moveFactorY;
        const newZ = centerOffsetZ + 1.181 + mouse.x * moveFactorZ;

        leftEyeRef.current.position.y = THREE.MathUtils.clamp(newY, bounds.y[0], bounds.y[1]);
        leftEyeRef.current.position.z = THREE.MathUtils.clamp(newZ, bounds.zLeft[1], bounds.zLeft[0]);
        }
    
        if (rightEyeRef.current) {
        const newY = centerOffsetY + 6.472 + mouse.y * moveFactorY;
        const newZ = centerOffsetZ + -0.452 + mouse.x * moveFactorZ;

        rightEyeRef.current.position.y = THREE.MathUtils.clamp(newY, bounds.y[0], bounds.y[1]);
        rightEyeRef.current.position.z = THREE.MathUtils.clamp(newZ, bounds.zRight[1], bounds.zRight[0]);
        }
    });

    // Select button animation
    useFrame(() => {
    const targetYEyebrow = animateSelect ? 6.8 : animateOk ? 6.95 : animateCancel ? 6.65 : eyebrowPositions.left[1];
    const targetYArms = animateOk ? 3.8 : animateCancel ? 3.3 : armsPosition[1]

    if (armsRef.current) {
        armsRef.current.position.y += (targetYArms - armsRef.current.position.y) * 0.1;
    }

    if (leftEyebrowRef.current) {
        leftEyebrowRef.current.position.y += (targetYEyebrow - leftEyebrowRef.current.position.y) * 0.1;
    }

    if (rightEyebrowRef.current) {
        rightEyebrowRef.current.position.y += (targetYEyebrow - rightEyebrowRef.current.position.y) * 0.1;
    }
    });

    // Store original positions
    const positions = useMemo(() => ({
        'smiley': [1.081, 2.554, 0.368],
        'sparkle_heart': [1.111, 4.965, -0.64],
        'heart_smiley': [1.139, 3.738, -0.643],
        'sad_smiley': [1.096, 4.948, 1.38],
        'three_hearts': [1.086, 3.756, 0.368]
    }), []);

    // References to the dispensable mesh
    const meshRefs = useRef({
        'smiley': null,
        'sparkle_heart': null,
        'heart_smiley': null,
        'sad_smiley': null,
        'three_hearts': null
    });

    // Animation offsets
    const offsets = {
        'smiley': { corner: [0.5, 0, 0], end: [0.5, -1.6, 0] },
        'sparkle_heart': { corner: [0.5, 0, 0], end: [0.5, -4, 0] },
        'heart_smiley': { corner: [0.5, 0, 0], end: [0.5, -2.8, 0] },
        'sad_smiley': { corner: [0.5, 0, 0], end: [0.5, -4, 0] },
        'three_hearts': { corner: [0.5, 0, 0], end: [0.5, -2.8, 0] }
    };

    // Duration of the second animation segment - dependent on how far the emoji is falling
    const segmentDurations = {
        'smiley': 600,
        'sparkle_heart': 1200,
        'heart_smiley': 900,
        'sad_smiley': 1200,
        'three_hearts': 900
    }

    // Check if it's time to reset the positions
    useEffect(() => {
        const resetPositions = () => {
        Object.keys(meshRefs.current).forEach(key => {
            const mesh = meshRefs.current[key];
            if (mesh) {
            mesh.position.set(...positions[key]);
            }
        });
        };

        if (resetPos) {
        resetPositions();
        setResetPos(false);
        }
    }, [resetPos, setResetPos, positions]);

    // Emoji animations
    useFrame((state, delta) => {
        if (triggerAnimation) {
        const offsetPositions = offsets[selectedButton];
        const group = meshRefs.current[selectedButton];
        const firstSegmentDuration = 500; // Duration for first segment (original to corner) in milliseconds
        const secondSegmentDuration = segmentDurations[selectedButton]; // Duration for second segment (corner to end) in milliseconds

        if (group) {
            const originalPosition = new THREE.Vector3(...positions[selectedButton]);
            const cornerPosition = originalPosition.clone().add(new THREE.Vector3(...offsetPositions.corner));
            const endPosition = originalPosition.clone().add(new THREE.Vector3(...offsetPositions.end));

            let targetPosition = new THREE.Vector3();
            const totalDuration = firstSegmentDuration + secondSegmentDuration;

            const progressIncrement = delta / (totalDuration / 1000);
            const newProgress = Math.min(animationProgress + progressIncrement, 1);
            setAnimationProgress(newProgress);

            if (newProgress < firstSegmentDuration / totalDuration) {
            // First half of the L shape: move to the corner
            const segmentProgress = newProgress / (firstSegmentDuration / totalDuration);
            targetPosition.lerpVectors(originalPosition, cornerPosition, segmentProgress);
            } else {
            // Second half of the L shape: move to the end position
            const segmentProgress = (newProgress - firstSegmentDuration / totalDuration) / (secondSegmentDuration / totalDuration);
            targetPosition.lerpVectors(cornerPosition, endPosition, segmentProgress);
            }

            group.position.copy(targetPosition);

            // Stop moving if close enough to end position and animation is complete
            if (newProgress >= 1) {
            group.position.copy(endPosition);
            setTriggerAnimation(false);
            setAnimationProgress(0); // Reset progress for next animation
            // Pause before opening popup
            setTimeout(() => {
                setAnimationComplete(true);
                setDisableButtons(false);
            }, 1500);
            }
        }
        }
    });

    // Function to handle hovering over a button
    const handleHoverIn = (buttonName) => {
        if (!disableButtons) {
        setCursorStyle('pointer');
        setHoveredButton(buttonName);
        }
    };

    // Function to handle hovering out of a button
    const handleHoverOut = () => {
        if (!disableButtons) {
        setCursorStyle('auto');
        setHoveredButton('');
        }
    };

    // Function to handle clicking on a button
    const handleClick = (buttonName) => {
        if (!disableButtons) {
        if (buttonName === 'cancel') {
            playSound('cancel');
            // Clear the selected button
            setSelectedButton('');
            setAnimateCancel(true)
            setTimeout(() => {
                setAnimateCancel(false);
            }, 300);
        } else if (buttonName === 'ok') {
            if (selectedButton === '') {
                setMessage('Please select one of the emoji buttons.');
                console.log('Please make a selection');
            } else {
                playSound('check');
                // trigger animation of selected button
                setCursorStyle('auto');
                setTriggerAnimation(true);
                setDisableButtons(true); // Don't allow button clicks when animation is running
                setAnimateOk(true);
                setTimeout(() => {
                    setAnimateOk(false);
                }, 300);
            }
        }
        else {
            setMessage('');
            playSound('emoji');
            // Set the selected button
            setSelectedButton(buttonName);
            setAnimateSelect(true);
            setTimeout(() => {
            setAnimateSelect(false);
            }, 200);
        }
        }
    };

    // Apply glow effect when selected
    const getMaterialWithGlow = (buttonName, materialName) => {
        const isActive = selectedButton === buttonName;
        const material = materials[materialName];
        if (material) {
        const newMaterial = material.clone();
        newMaterial.emissive = isActive ? new THREE.Color('#fae') : new THREE.Color('black');
        newMaterial.emissiveIntensity = isActive ? 0.25 : 0;
        return newMaterial;
        }
        return material;
    };

    return (
        <group {...props} dispose={null} position={[0, -3, 0]}>

            {/************/}
            {/************/}
            {/** BUTTONS */}
            {/************/}
            {/************/}

            {/** OKAY BUTTON */}
            <mesh
                onPointerOver={() => handleHoverIn('ok')}
                onPointerOut={handleHoverOut}
                onClick={() => handleClick('ok')}
                name="ok_button"
                castShadow
                receiveShadow
                geometry={nodes.ok_button.geometry}
                material={materials['ok button']}
                position={[hoveredButton === 'ok' ? 2 : 2.083, 3.28, -1.917]}>
                <mesh
                    name="checkmark"
                    castShadow
                    receiveShadow
                    geometry={nodes.checkmark.geometry}
                    material={materials.checkmark}
                    position={[0.026, 0.004, -0.007]}
                />
            </mesh>

            {/** CANCEL BUTTON */}
            <mesh
                onPointerOver={() => handleHoverIn('cancel')}
                onPointerOut={handleHoverOut}
                onClick={() => handleClick('cancel')}
                name="cancel_button"
                castShadow
                receiveShadow
                geometry={nodes.cancel_button.geometry}
                material={materials['cancel button bg']}
                position={[hoveredButton === 'cancel' ? 2 : 2.083, 2.413, -1.917]}>
                <mesh
                    name="cancel_symbol"
                    castShadow
                    receiveShadow
                    geometry={nodes.cancel_symbol.geometry}
                    material={materials.x}
                    position={[0.026, 0, 0]}
                />
            </mesh>

            {/** SMILEY BUTTON */}
            <group 
            onPointerOver={() => handleHoverIn('smiley')}
            onPointerOut={handleHoverOut}
            onClick={() => handleClick('smiley')}
            name="smiley_button" 
            position={[hoveredButton === 'smiley' || selectedButton === 'smiley' ? 1.95 : 2.051, 6.006, -1.913]}
            >
                <mesh
                    name="Circle006"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle006.geometry}
                    material={getMaterialWithGlow('smiley', 'smiley bg')}
                />
                <mesh
                    name="Circle006_1"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle006_1.geometry}
                    material={getMaterialWithGlow('smiley', 'smiley border')}
                />
                <mesh
                    name="Circle006_2"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle006_2.geometry}
                    material={getMaterialWithGlow('smiley', 'smiley mouth + eyes')}
                />
                <mesh
                    name="Circle006_3"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle006_3.geometry}
                    material={getMaterialWithGlow('smiley', 'smiley cheeks')}
                />
            </group>

            {/** SPARKLE HEART BUTTON */}
            <group 
                onPointerOver={() => handleHoverIn('sparkle_heart')}
                onPointerOut={handleHoverOut}
                onClick={() => handleClick('sparkle_heart')}
                name="sparkle_heart_button" 
                position={[hoveredButton === 'sparkle_heart' || selectedButton === 'sparkle_heart' ? 1.95 : 2.051, 5.419, -1.908]}
            >
                <mesh
                    name="Plane017"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane017.geometry}
                    material={getMaterialWithGlow('sparkle_heart', 'heart')}
                />
                <mesh
                    name="Plane017_1"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane017_1.geometry}
                    material={getMaterialWithGlow('sparkle_heart', 'heart border')}
                />
                <mesh
                    name="Plane017_2"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane017_2.geometry}
                    material={getMaterialWithGlow('sparkle_heart', 'heart sparkle')}
                />
            </group>

            {/** HEART SMILEY BUTTON */}
            <group 
                onPointerOver={() => handleHoverIn('heart_smiley')}
                onPointerOut={handleHoverOut}
                onClick={() => handleClick('heart_smiley')}
                name="heart_smiley_button" 
                position={[hoveredButton === 'heart_smiley' || selectedButton === 'heart_smiley' ? 1.95 : 2.051, 6.565, -1.914]}
            >
                <mesh
                    name="Circle001"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle001.geometry}
                    material={getMaterialWithGlow('heart_smiley', 'smiley bg')}
                />
                <mesh
                    name="Circle001_1"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle001_1.geometry}
                    material={getMaterialWithGlow('heart_smiley', 'smiley border')}
                />
                <mesh
                    name="Circle001_2"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle001_2.geometry}
                    material={getMaterialWithGlow('heart_smiley', 'smiley mouth + eyes')}
                />
                <mesh
                    name="Circle001_3"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle001_3.geometry}
                    material={getMaterialWithGlow('heart_smiley', 'smiley heart')}
                />
                <mesh
                    name="Circle001_4"
                    castShadow
                    receiveShadow
                    geometry={nodes.Circle001_4.geometry}
                    material={getMaterialWithGlow('heart_smiley', 'smiley heart border')}
                />
            </group>

            {/** SAD SMILEY BUTTON */}
            <group 
                onPointerOver={() => handleHoverIn('sad_smiley')}
                onPointerOut={handleHoverOut}
                onClick={() => handleClick('sad_smiley')}
                name="sad_smiley_button" 
                position={[hoveredButton === 'sad_smiley' || selectedButton === 'sad_smiley' ? 1.95 : 2.051, 4.848, -1.913]}
            >
                <mesh
                    name="Plane023"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane023.geometry}
                    material={getMaterialWithGlow('sad_smiley', 'smiley mouth + eyes')}
                />
                <mesh
                    name="Plane023_1"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane023_1.geometry}
                    material={getMaterialWithGlow('sad_smiley', 'smiley bg')}
                />
                <mesh
                    name="Plane023_2"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane023_2.geometry}
                    material={getMaterialWithGlow('sad_smiley', 'smiley border')}
                />
                <mesh
                    name="Plane023_3"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane023_3.geometry}
                    material={getMaterialWithGlow('sad_smiley', 'sad tear')}
                />
            </group>

            {/** THREE HEARTS BUTTON */}
            <group 
                onPointerOver={() => handleHoverIn('three_hearts')}
                onPointerOut={handleHoverOut}
                onClick={() => handleClick('three_hearts')}
                name="three_hearts_button" 
                position={[hoveredButton === 'three_hearts' || selectedButton === 'three_hearts' ? 1.95 : 2.051, 4.22, -1.913]}
            >
                <mesh
                    name="Plane025"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane025.geometry}
                    material={getMaterialWithGlow('three_hearts', 'heart lightest')}
                />
                <mesh
                    name="Plane025_1"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane025_1.geometry}
                    material={getMaterialWithGlow('three_hearts', 'heart lightest border')}
                />
                <mesh
                    name="Plane025_2"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane025_2.geometry}
                    material={getMaterialWithGlow('three_hearts', 'heart light')}
                />
                <mesh
                    name="Plane025_3"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane025_3.geometry}
                    material={getMaterialWithGlow('three_hearts', 'heart light border')}
                />
                <mesh
                    name="Plane025_4"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane025_4.geometry}
                    material={getMaterialWithGlow('three_hearts', 'heart')}
                />
                <mesh
                    name="Plane025_5"
                    castShadow
                    receiveShadow
                    geometry={nodes.Plane025_5.geometry}
                    material={getMaterialWithGlow('three_hearts', 'heart border')}
                />
            </group>

            {/*****************/}
            {/*****************/}
            {/** DISPENSABLES */}
            {/*****************/}
            {/*****************/}

            {/** HEART SMILEY DISPENSABLE */}
            <group 
                name="heart_smiley_1"
                position={positions['heart_smiley']}
                ref={(ref) => (meshRefs.current['heart_smiley'] = ref)}
            >
                <mesh
                name="Circle008"
                castShadow
                receiveShadow
                geometry={nodes.Circle008.geometry}
                material={materials['smiley bg.001']}
                />
                <mesh
                name="Circle008_1"
                castShadow
                receiveShadow
                geometry={nodes.Circle008_1.geometry}
                material={materials['smiley border.001']}
                />
                <mesh
                name="Circle008_2"
                castShadow
                receiveShadow
                geometry={nodes.Circle008_2.geometry}
                material={materials['smiley mouth + eyes.001']}
                />
                <mesh
                name="Circle008_3"
                castShadow
                receiveShadow
                geometry={nodes.Circle008_3.geometry}
                material={materials['smiley heart.001']}
                />
                <mesh
                name="Circle008_4"
                castShadow
                receiveShadow
                geometry={nodes.Circle008_4.geometry}
                material={materials['smiley heart border.001']}
                />
            </group>
            <group name="heart_smiley_2" position={[1.115, 2.561, -0.643]}>
                <mesh
                name="Circle012"
                castShadow
                receiveShadow
                geometry={nodes.Circle012.geometry}
                material={materials['smiley bg.001']}
                />
                <mesh
                name="Circle012_1"
                castShadow
                receiveShadow
                geometry={nodes.Circle012_1.geometry}
                material={materials['smiley border.001']}
                />
                <mesh
                name="Circle012_2"
                castShadow
                receiveShadow
                geometry={nodes.Circle012_2.geometry}
                material={materials['smiley mouth + eyes.001']}
                />
                <mesh
                name="Circle012_3"
                castShadow
                receiveShadow
                geometry={nodes.Circle012_3.geometry}
                material={materials['smiley heart.001']}
                />
                <mesh
                name="Circle012_4"
                castShadow
                receiveShadow
                geometry={nodes.Circle012_4.geometry}
                material={materials['smiley heart border.001']}
                />
            </group>

            {/** SAD SMILEY DISPENSABLE */}
            <group 
            name="sad_smiley_1" 
            position={positions['sad_smiley']}
            ref={(ref) => (meshRefs.current['sad_smiley'] = ref)}
            >
                <mesh
                name="Plane007"
                castShadow
                receiveShadow
                geometry={nodes.Plane007.geometry}
                material={materials['smiley mouth + eyes.002']}
                />
                <mesh
                name="Plane007_1"
                castShadow
                receiveShadow
                geometry={nodes.Plane007_1.geometry}
                material={materials['smiley bg.002']}
                />
                <mesh
                name="Plane007_2"
                castShadow
                receiveShadow
                geometry={nodes.Plane007_2.geometry}
                material={materials['smiley border.002']}
                />
                <mesh
                name="Plane007_3"
                castShadow
                receiveShadow
                geometry={nodes.Plane007_3.geometry}
                material={materials['sad tear.003']}
                />
            </group>
            <group name="smiley_1" position={[1.081, 2.554, 1.38]}>
                <mesh
                name="Circle016"
                castShadow
                receiveShadow
                geometry={nodes.Circle016.geometry}
                material={materials['smiley bg.001']}
                />
                <mesh
                name="Circle016_1"
                castShadow
                receiveShadow
                geometry={nodes.Circle016_1.geometry}
                material={materials['smiley border.001']}
                />
                <mesh
                name="Circle016_2"
                castShadow
                receiveShadow
                geometry={nodes.Circle016_2.geometry}
                material={materials['smiley mouth + eyes.001']}
                />
                <mesh
                name="Circle016_3"
                castShadow
                receiveShadow
                geometry={nodes.Circle016_3.geometry}
                material={materials['smiley cheeks.001']}
                />
            </group>

            {/** SMILEY DISPENSABLE */}
            <group 
                name="smiley_2" 
                position={positions['smiley']}
                ref={(ref) => (meshRefs.current['smiley'] = ref)}
            >
                <mesh
                name="Circle018"
                castShadow
                receiveShadow
                geometry={nodes.Circle018.geometry}
                material={materials['smiley bg.001']}
                />
                <mesh
                name="Circle018_1"
                castShadow
                receiveShadow
                geometry={nodes.Circle018_1.geometry}
                material={materials['smiley border.001']}
                />
                <mesh
                name="Circle018_2"
                castShadow
                receiveShadow
                geometry={nodes.Circle018_2.geometry}
                material={materials['smiley mouth + eyes.001']}
                />
                <mesh
                name="Circle018_3"
                castShadow
                receiveShadow
                geometry={nodes.Circle018_3.geometry}
                material={materials['smiley cheeks.001']}
                />
            </group>
            <group name="sparkle_hearts_1" position={[1.111, 4.965, 0.368]}>
                <mesh
                name="Plane009"
                castShadow
                receiveShadow
                geometry={nodes.Plane009.geometry}
                material={materials['heart.001']}
                />
                <mesh
                name="Plane009_1"
                castShadow
                receiveShadow
                geometry={nodes.Plane009_1.geometry}
                material={materials['heart border.001']}
                />
                <mesh
                name="Plane009_2"
                castShadow
                receiveShadow
                geometry={nodes.Plane009_2.geometry}
                material={materials['heart sparkle.001']}
                />
            </group>

            {/** SPARKLE HEARTS DISPENSABLE */}
            <group 
                name="sparkle_hearts_2" 
                position={positions['sparkle_heart']}
                ref={(ref) => (meshRefs.current['sparkle_heart'] = ref)}
            >
                <mesh
                name="Plane012"
                castShadow
                receiveShadow
                geometry={nodes.Plane012.geometry}
                material={materials['heart.001']}
                />
                <mesh
                name="Plane012_1"
                castShadow
                receiveShadow
                geometry={nodes.Plane012_1.geometry}
                material={materials['heart border.001']}
                />
                <mesh
                name="Plane012_2"
                castShadow
                receiveShadow
                geometry={nodes.Plane012_2.geometry}
                material={materials['heart sparkle.001']}
                />
            </group>
            <group name="three_hearts_1" position={[1.094, 3.756, 1.38]}>
                <mesh
                name="Plane014"
                castShadow
                receiveShadow
                geometry={nodes.Plane014.geometry}
                material={materials['heart lightest.001']}
                />
                <mesh
                name="Plane014_1"
                castShadow
                receiveShadow
                geometry={nodes.Plane014_1.geometry}
                material={materials['heart lightest border.001']}
                />
                <mesh
                name="Plane014_2"
                castShadow
                receiveShadow
                geometry={nodes.Plane014_2.geometry}
                material={materials['heart light.001']}
                />
                <mesh
                name="Plane014_3"
                castShadow
                receiveShadow
                geometry={nodes.Plane014_3.geometry}
                material={materials['heart light border.001']}
                />
                <mesh
                name="Plane014_4"
                castShadow
                receiveShadow
                geometry={nodes.Plane014_4.geometry}
                material={materials['heart.001']}
                />
                <mesh
                name="Plane014_5"
                castShadow
                receiveShadow
                geometry={nodes.Plane014_5.geometry}
                material={materials['heart border.001']}
                />
            </group>

            {/** THREE HEARTS DISPENSABLE */}
            <group 
            name="three_hearts_2" 
            position={positions['three_hearts']}
            ref={(ref) => (meshRefs.current['three_hearts'] = ref)}
            >
                <mesh
                name="Plane016"
                castShadow
                receiveShadow
                geometry={nodes.Plane016.geometry}
                material={materials['heart lightest.001']}
                />
                <mesh
                name="Plane016_1"
                castShadow
                receiveShadow
                geometry={nodes.Plane016_1.geometry}
                material={materials['heart lightest border.001']}
                />
                <mesh
                name="Plane016_2"
                castShadow
                receiveShadow
                geometry={nodes.Plane016_2.geometry}
                material={materials['heart light.001']}
                />
                <mesh
                name="Plane016_3"
                castShadow
                receiveShadow
                geometry={nodes.Plane016_3.geometry}
                material={materials['heart light border.001']}
                />
                <mesh
                name="Plane016_4"
                castShadow
                receiveShadow
                geometry={nodes.Plane016_4.geometry}
                material={materials['heart.001']}
                />
                <mesh
                name="Plane016_5"
                castShadow
                receiveShadow
                geometry={nodes.Plane016_5.geometry}
                material={materials['heart border.001']}
                />
            </group>
            <group name="emojis" position={[0.22, 3.756, 0.368]}>
                <mesh
                name="Plane015"
                castShadow
                receiveShadow
                geometry={nodes.Plane015.geometry}
                material={materials['heart lightest.001']}
                />
                <mesh
                name="Plane015_1"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_1.geometry}
                material={materials['heart lightest border.001']}
                />
                <mesh
                name="Plane015_2"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_2.geometry}
                material={materials['heart light.001']}
                />
                <mesh
                name="Plane015_3"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_3.geometry}
                material={materials['heart light border.001']}
                />
                <mesh
                name="Plane015_4"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_4.geometry}
                material={materials['heart.001']}
                />
                <mesh
                name="Plane015_5"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_5.geometry}
                material={materials['heart border.001']}
                />
                <mesh
                name="Plane015_6"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_6.geometry}
                material={materials['smiley bg.001']}
                />
                <mesh
                name="Plane015_7"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_7.geometry}
                material={materials['smiley border.001']}
                />
                <mesh
                name="Plane015_8"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_8.geometry}
                material={materials['smiley mouth + eyes.001']}
                />
                <mesh
                name="Plane015_9"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_9.geometry}
                material={materials['smiley heart.001']}
                />
                <mesh
                name="Plane015_10"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_10.geometry}
                material={materials['smiley heart border.001']}
                />
                <mesh
                name="Plane015_11"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_11.geometry}
                material={materials['sad tear.002']}
                />
                <mesh
                name="Plane015_12"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_12.geometry}
                material={materials['smiley cheeks.001']}
                />
                <mesh
                name="Plane015_13"
                castShadow
                receiveShadow
                geometry={nodes.Plane015_13.geometry}
                material={materials['heart sparkle.001']}
                />
            </group>

            {/***************************************************/}
            {/***************************************************/}
            {/***************************************************/}
            {/******************* FACE & BODY *******************/}
            {/***************************************************/}
            {/***************************************************/}
            {/***************************************************/}
            <mesh
                name="eyes"
                castShadow
                receiveShadow
                geometry={nodes.eyes.geometry}
                material={materials.face}
                position={[1.442, 6.468, 0.365]}
                rotation={[0, 0, -Math.PI / 2]}
                scale={[0.166, 0.166, 0.13]}
            />
            {!triggerAnimation ? (
            <mesh
                name="mouth"
                castShadow
                receiveShadow
                geometry={nodes.mouth.geometry}
                material={materials.face}
                position={[1.419, 6.296, 0.365]}
                rotation={[Math.PI / 2, 0, -Math.PI / 2]}
            />
            ) : (
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.excited_mouth.geometry}
                material={materials.face}
                position={[1.447, 6.307, 0.365]}
            />
            )}
            <mesh
                ref={leftEyeRef}
                name="eye_sparkle_left"
                castShadow
                receiveShadow
                geometry={nodes.eye_sparkle_left.geometry}
                material={materials['eye glimmer']}
                position={[1.448, 6.472, 1.181]}
                rotation={[0, 0, -Math.PI / 2]}
                scale={0.018}
            />
            <mesh
                ref={rightEyeRef}
                name="eye_sparkle_right"
                castShadow
                receiveShadow
                geometry={nodes.eye_sparkle_right.geometry}
                material={materials['eye glimmer']}
                position={[1.448, 6.472, -0.452]}
                rotation={[0, 0, -Math.PI / 2]}
                scale={0.018}
            />
            <mesh
                name="cheeks"
                castShadow
                receiveShadow
                geometry={nodes.cheeks.geometry}
                material={materials.cheeks}
                position={[1.442, 6.223, 0.365]}
                rotation={[0, 0, -Math.PI / 2]}
                scale={[0.114, 0.166, 0.166]}
            />
            <mesh
                ref={armsRef}
                name="arms"
                castShadow
                receiveShadow
                geometry={nodes.arms.geometry}
                material={materials['vending machine']}
                position={[0.068, 3.418, 0]}
                rotation={[0, 0, -Math.PI / 2]}>
                <mesh
                name="hand"
                castShadow
                receiveShadow
                geometry={nodes.hand.geometry}
                material={materials['vending machine']}
                position={[0.972, 0.068, 0]}
                rotation={[1.571, 0, -Math.PI / 2]}
                scale={[0.216, 0.578, 0.356]}
                />
            </mesh>
            <mesh
                ref={leftEyebrowRef}
                name="left_eyebrow"
                castShadow
                receiveShadow
                geometry={nodes.left_eyebrow.geometry}
                material={materials.face}
                position={[1.434, 6.716, 1.311]}
                rotation={[1.917, 0, -Math.PI / 2]}
            />
            <mesh
                ref={rightEyebrowRef}
                name="right_eyebrow"
                castShadow
                receiveShadow
                geometry={nodes.right_eyebrow.geometry}
                material={materials.face}
                position={[1.434, 6.712, -0.58]}
                rotation={[1.917, 0, -Math.PI / 2]}
            />
            <group name="vending_machine_interior" position={[0.292, 4.523, 0.391]}>
                <mesh
                    name="Cube002"
                    castShadow
                    receiveShadow
                    geometry={nodes.Cube002.geometry}
                    material={materials['vending machine']}
                />
                <mesh
                    name="Cube002_1"
                    castShadow
                    receiveShadow
                    geometry={nodes.Cube002_1.geometry}
                    material={materials['vending machine interior']}
                />
            </group>
            <mesh
                name="glass"
                castShadow
                receiveShadow
                geometry={nodes.glass.geometry}
                material={materials.Glass}
                position={[1.841, 4.523, 0.391]}
            />
            <group name="vending_machine" position={[0, 3.543, 0]}>
                <mesh
                name="Cube005"
                castShadow
                receiveShadow
                geometry={nodes.Cube005.geometry}
                material={materials['vending machine']}
                />
                <mesh
                name="Cube005_1"
                castShadow
                receiveShadow
                geometry={nodes.Cube005_1.geometry}
                material={materials['vending machine interior']}
                />
            </group>
            <group name="door" position={[1.918, 1.014, 0.391]}>
                <mesh
                name="Cube006"
                castShadow
                receiveShadow
                geometry={nodes.Cube006.geometry}
                material={materials.Glass}
                />
                <mesh
                name="Cube006_1"
                castShadow
                receiveShadow
                geometry={nodes.Cube006_1.geometry}
                material={materials.buttons}
                />
            </group>
        </group>
    )
}

useGLTF.preload('/vending-machine.glb')