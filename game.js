```javascript
import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


/*
============================================================
                    KART RACER 3D
                    VERSION 1
============================================================

FEATURES
------------------------------------------------------------
- 3D rounded racing track
- 3D kart
- Third-person follow camera
- Acceleration
- Braking
- Reverse
- Steering
- Frame-rate-independent physics
- Track boundaries
- Grass slowdown
- Checkpoints
- 3 laps
- Race countdown
- Race timer
- Lap timer
- Best lap
- Finish screen
- Respawning
============================================================
*/


// ============================================================
// DOM
// ============================================================

const canvas =
    document.getElementById("gameCanvas");

const container =
    document.getElementById("game");

const lapDisplay =
    document.getElementById("lapDisplay");

const timeDisplay =
    document.getElementById("timeDisplay");

const bestLapDisplay =
    document.getElementById("bestLapDisplay");

const speedDisplay =
    document.getElementById("speedDisplay");

const countdownElement =
    document.getElementById("countdown");

const finishScreen =
    document.getElementById("finishScreen");

const finalTime =
    document.getElementById("finalTime");

const finalBestLap =
    document.getElementById("finalBestLap");

const restartButton =
    document.getElementById("restartButton");


// ============================================================
// THREE.JS SCENE
// ============================================================

const scene = new THREE.Scene();

scene.background =
    new THREE.Color(0x87ceeb);

scene.fog =
    new THREE.Fog(
        0x87ceeb,
        100,
        260
    );


// ============================================================
// CAMERA
// ============================================================

const camera =
    new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );


// ============================================================
// RENDERER
// ============================================================

const renderer =
    new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


// ============================================================
// LIGHTING
// ============================================================

const hemisphereLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x477247,
        2.2
    );

scene.add(hemisphereLight);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        3
    );

sun.position.set(
    50,
    100,
    40
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;

scene.add(sun);


// ============================================================
// WORLD
// ============================================================

const grassMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x3f913f
    });

const grass =
    new THREE.Mesh(
        new THREE.PlaneGeometry(
            240,
            200
        ),
        grassMaterial
    );

grass.rotation.x =
    -Math.PI / 2;

grass.receiveShadow = true;

scene.add(grass);


// ============================================================
// TRACK SETTINGS
// ============================================================

const TRACK_WIDTH = 14;

const TRACK_HALF_X = 48;

const TRACK_HALF_Z = 30;

const CORNER_RADIUS = 12;

const TRACK_Y = 0;


// ============================================================
// CREATE ROUNDED RECTANGLE CENTERLINE
// ============================================================

function createTrackPoints() {

    const points = [];

    const steps = 35;

    const cx = TRACK_HALF_X;
    const cz = TRACK_HALF_Z;
    const r = CORNER_RADIUS;


    function addArc(
        centerX,
        centerZ,
        startAngle,
        endAngle
    ) {

        for (
            let i = 0;
            i < steps;
            i++
        ) {

            const t =
                i / steps;

            const angle =
                startAngle +
                (endAngle - startAngle) * t;

            points.push(
                new THREE.Vector3(
                    centerX +
                    Math.cos(angle) * r,

                    0,

                    centerZ +
                    Math.sin(angle) * r
                )
            );
        }
    }


    // Top-right
    addArc(
        cx - r,
        cz - r,
        -Math.PI / 2,
        0
    );


    // Bottom-right
    addArc(
        cx - r,
        -cz + r,
        0,
        Math.PI / 2
    );


    // Bottom-left
    addArc(
        -cx + r,
        -cz + r,
        Math.PI / 2,
        Math.PI
    );


    // Top-left
    addArc(
        -cx + r,
        cz - r,
        Math.PI,
        Math.PI * 1.5
    );


    return points;
}


const trackPoints =
    createTrackPoints();


// ============================================================
// TRACK GEOMETRY
// ============================================================

function buildTrack() {

    const positions = [];

    const indices = [];

    const innerPoints = [];

    const outerPoints = [];


    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const current =
            trackPoints[i];

        const next =
            trackPoints[
                (i + 1) %
                trackPoints.length
            ];

        const direction =
            new THREE.Vector3()
                .subVectors(
                    next,
                    current
                )
                .normalize();


        const normal =
            new THREE.Vector3(
                -direction.z,
                0,
                direction.x
            );


        const inner =
            current.clone()
                .add(
                    normal.clone()
                        .multiplyScalar(
                            -TRACK_WIDTH / 2
                        )
                );


        const outer =
            current.clone()
                .add(
                    normal.clone()
                        .multiplyScalar(
                            TRACK_WIDTH / 2
                        )
                );


        inner.y = 0.05;
        outer.y = 0.05;


        innerPoints.push(inner);
        outerPoints.push(outer);
    }


    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const inner =
            innerPoints[i];

        const outer =
            outerPoints[i];

        positions.push(
            inner.x,
            inner.y,
            inner.z,

            outer.x,
            outer.y,
            outer.z
        );
    }


    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const next =
            (i + 1) %
            trackPoints.length;

        indices.push(
            i * 2,
            next * 2,
            i * 2 + 1
        );

        indices.push(
            i * 2 + 1,
            next * 2,
            next * 2 + 1
        );
    }


    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    geometry.setIndex(indices);

    geometry.computeVertexNormals();


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x3b3b3b,
            roughness: 0.95
        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.receiveShadow = true;

    scene.add(mesh);


    return {
        innerPoints,
        outerPoints
    };
}


const track =
    buildTrack();


// ============================================================
// TRACK DECORATION
// ============================================================

function createTrackBorders() {

    const borderMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });


    for (
        let i = 0;
        i < trackPoints.length;
        i += 2
    ) {

        const p =
            trackPoints[i];

        const next =
            trackPoints[
                (i + 1) %
                trackPoints.length
            ];


        const direction =
            new THREE.Vector3()
                .subVectors(
                    next,
                    p
                )
                .normalize();


        const normal =
            new THREE.Vector3(
                -direction.z,
                0,
                direction.x
            );


        for (
            const side of [-1, 1]
        ) {

            const position =
                p.clone()
                    .add(
                        normal
                            .clone()
                            .multiplyScalar(
                                side *
                                (TRACK_WIDTH / 2 + 0.45)
                            )
                    );

            position.y = 0.25;


            const border =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        0.7,
                        0.15,
                        2.5
                    ),
                    borderMaterial
                );


            border.position.copy(
                position
            );

            border.lookAt(
                next.x,
                position.y,
                next.z
            );

            border.castShadow = true;

            scene.add(border);
        }
    }
}


createTrackBorders();


// ============================================================
// RED CURBS
// ============================================================

function createCurbs() {

    const red =
        new THREE.MeshStandardMaterial({
            color: 0xd92727
        });

    const white =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });


    for (
        let i = 0;
        i < trackPoints.length;
        i += 3
    ) {

        const p =
            trackPoints[i];

        const next =
            trackPoints[
                (i + 1) %
                trackPoints.length
            ];


        const direction =
            new THREE.Vector3()
                .subVectors(
                    next,
                    p
                )
                .normalize();


        const normal =
            new THREE.Vector3(
                -direction.z,
                0,
                direction.x
            );


        for (
            const side of [-1, 1]
        ) {

            const position =
                p.clone()
                    .add(
                        normal.clone()
                            .multiplyScalar(
                                side *
                                (TRACK_WIDTH / 2 + 0.9)
                            )
                    );

            position.y = 0.3;


            const curb =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        1.4,
                        0.25,
                        2.5
                    ),
                    (i / 3) % 2 === 0
                        ? red
                        : white
                );


            curb.position.copy(
                position
            );

            curb.lookAt(
                next.x,
                position.y,
                next.z
            );

            curb.castShadow = true;

            scene.add(curb);
        }
    }
}


createCurbs();


// ============================================================
// FINISH LINE
// ============================================================

function createFinishLine() {

    const group =
        new THREE.Group();


    const squareSize = 1.5;


    const whiteMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });


    const blackMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });


    for (
        let x = -4;
        x <= 4;
        x++
    ) {

        for (
            let z = 0;
            z < 2;
            z++
        ) {

            const square =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        squareSize,
                        0.08,
                        squareSize
                    ),
                    (x + z) % 2 === 0
                        ? whiteMaterial
                        : blackMaterial
                );


            square.position.set(
                x * squareSize,
                0.15,
                z * squareSize
            );


            group.add(square);
        }
    }


    const start =
        trackPoints[0];

    const next =
        trackPoints[1];


    group.position.copy(start);

    group.lookAt(
        next.x,
        group.position.y,
        next.z
    );


    scene.add(group);
}


createFinishLine();


// ============================================================
// TREES
// ============================================================

function createTree(x, z) {

    const tree =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.45,
                0.55,
                3,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x704214
            })
        );


    trunk.position.y = 1.5;

    trunk.castShadow = true;

    tree.add(trunk);


    const leaves =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                2.3,
                5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x176b2b
            })
        );


    leaves.position.y = 5;

    leaves.castShadow = true;

    tree.add(leaves);


    tree.position.set(
        x,
        0,
        z
    );


    scene.add(tree);
}


[
    [-75, -45],
    [-65, 45],
    [-30, -48],
    [0, -50],
    [30, -48],
    [65, 45],
    [75, -45],
    [30, 47],
    [-30, 47]
].forEach(
    position =>
        createTree(
            position[0],
            position[1]
        )
);


// ============================================================
// KART
// ============================================================

function createKart() {

    const kart =
        new THREE.Group();


    // Main body
    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                0.75,
                4.2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1976d2,
                roughness: 0.7
            })
        );


    body.position.y = 0.8;

    body.castShadow = true;

    kart.add(body);


    // Hood
    const hood =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                0.45,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x2196f3
            })
        );


    hood.position.set(
        0,
        1.2,
        -1.1
    );

    hood.castShadow = true;

    kart.add(hood);


    // Seat
    const seat =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.4,
                1.2,
                1.3
            ),
            new THREE.MeshStandardMaterial({
                color: 0x181818
            })
        );


    seat.position.set(
        0,
        1.25,
        0.55
    );

    seat.castShadow = true;

    kart.add(seat);


    // Front bumper
    const bumper =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.9,
                0.25,
                0.3
            ),
            new THREE.MeshStandardMaterial({
                color: 0x111111
            })
        );


    bumper.position.set(
        0,
        0.65,
        -2.1
    );

    bumper.castShadow = true;

    kart.add(bumper);


    // Wheels
    const wheelMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9
        });


    const wheelPositions = [
        [-1.55, 0.55, -1.35],
        [1.55, 0.55, -1.35],
        [-1.55, 0.55, 1.35],
        [1.55, 0.55, 1.35]
    ];


    for (
        const position of wheelPositions
    ) {

        const wheel =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.68,
                    0.68,
                    0.45,
                    16
                ),
                wheelMaterial
            );


        wheel.rotation.z =
            Math.PI / 2;


        wheel.position.set(
            position[0],
            position[1],
            position[2]
        );


        wheel.castShadow = true;

        kart.add(wheel);
    }


    return kart;
}


const kart =
    createKart();

scene.add(kart);


// ============================================================
// PLAYER PHYSICS
// ============================================================

const player = {

    // Position
    position:
        new THREE.Vector3(),

    // Velocity
    velocity:
        new THREE.Vector3(),

    // Current forward speed
    speed: 0,

    // Maximum forward speed
    maxSpeed: 22,

    // Reverse speed
    maxReverseSpeed: 8,

    // Acceleration
    acceleration: 15,

    // Braking
    brakePower: 24,

    // Natural slowdown
    friction: 8,

    // Steering strength
    steering: 2.8,

    // Grip
    grip: 8,

    // Track status
    onTrack: true,

    // Current direction
    heading: 0,

    // Start position
    spawnPosition:
        new THREE.Vector3(),

    spawnHeading: 0
};


// ============================================================
// START POSITION
// ============================================================

function setStartingPosition() {

    const start =
        trackPoints[0];

    const next =
        trackPoints[1];


    player.position.copy(start);

    player.position.y = 0;


    const direction =
        new THREE.Vector3()
            .subVectors(
                next,
                start
            )
            .normalize();


    player.heading =
        Math.atan2(
            direction.x,
            direction.z
        );


    player.spawnPosition.copy(
        player.position
    );

    player.spawnHeading =
        player.heading;


    kart.position.copy(
        player.position
    );

    kart.rotation.y =
        player.heading;
}


setStartingPosition();


// ============================================================
// CONTROLS
// ============================================================

const keys = {};


window.addEventListener(
    "keydown",
    event => {

        keys[
            event.key.toLowerCase()
        ] = true;


        if (
            [
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright",
                " "
            ].includes(
                event.key.toLowerCase()
            )
        ) {

            event.preventDefault();
        }
    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[
            event.key.toLowerCase()
        ] = false;
    }
);


function isPressed(...names) {

    return names.some(
        name => keys[name]
    );
}


// ============================================================
// TRACK DETECTION
// ============================================================

function getClosestTrackPoint(
    position
) {

    let closestDistance =
        Infinity;

    let closestIndex = 0;


    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const distance =
            position.distanceTo(
                trackPoints[i]
            );


        if (
            distance <
            closestDistance
        ) {

            closestDistance =
                distance;

            closestIndex = i;
        }
    }


    return {
        index: closestIndex,
        distance: closestDistance
    };
}


// ============================================================
// CHECK WHETHER PLAYER IS ON ROAD
// ============================================================

function checkTrackStatus() {

    const result =
        getClosestTrackPoint(
            player.position
        );


    player.onTrack =
        result.distance <=
        TRACK_WIDTH / 2;


    return result;
}


// ============================================================
// PHYSICS UPDATE
// ============================================================

function updatePhysics(delta) {

    if (!raceStarted || raceFinished) {
        return;
    }


    const accelerate =
        isPressed(
            "w",
            "arrowup"
        );


    const brake =
        isPressed(
            "s",
            "arrowdown"
        );


    const left =
        isPressed(
            "a",
            "arrowleft"
        );


    const right =
        isPressed(
            "d",
            "arrowright"
        );


    const steeringInput =
        (right ? 1 : 0) -
        (left ? 1 : 0);


    // ========================================================
    // ACCELERATION
    // ========================================================

    if (accelerate) {

        player.speed +=
            player.acceleration *
            delta;
    }


    // ========================================================
    // BRAKING / REVERSE
    // ========================================================

    if (brake) {

        if (player.speed > 0) {

            player.speed -=
                player.brakePower *
                delta;

        } else {

            player.speed -=
                player.acceleration *
                0.75 *
                delta;
        }
    }


    // ========================================================
    // NATURAL FRICTION
    // ========================================================

    if (
        !accelerate &&
        !brake
    ) {

        if (
            player.speed > 0
        ) {

            player.speed =
                Math.max(
                    0,
                    player.speed -
                    player.friction *
                    delta
                );

        } else if (
            player.speed < 0
        ) {

            player.speed =
                Math.min(
                    0,
                    player.speed +
                    player.friction *
                    delta
                );
        }
    }


    // ========================================================
    // SPEED LIMIT
    // ========================================================

    player.speed =
        THREE.MathUtils.clamp(
            player.speed,
            -player.maxReverseSpeed,
            player.maxSpeed
        );


    // ========================================================
    // TRACK CHECK
    // ========================================================

    checkTrackStatus();


    // ========================================================
    // GRASS SLOWDOWN
    // ========================================================

    if (!player.onTrack) {

        player.speed *=
            Math.pow(
                0.20,
                delta
            );
    }


    // ========================================================
    // STEERING
    // ========================================================

    if (
        Math.abs(player.speed) >
        0.15
    ) {

        const speedRatio =
            Math.min(
                Math.abs(player.speed) /
                player.maxSpeed,
                1
            );


        const steeringStrength =
            player.steering *
            (
                0.25 +
                speedRatio * 0.75
            );


        let direction =
            steeringInput;


        if (
            player.speed < 0
        ) {

            direction *= -1;
        }


        player.heading +=
            direction *
            steeringStrength *
            delta;
    }


    // ========================================================
    // FORWARD VECTOR
    // ========================================================

    const forward =
        new THREE.Vector3(
            Math.sin(player.heading),
            0,
            Math.cos(player.heading)
        );


    // ========================================================
    // VELOCITY
    // ========================================================

    player.velocity.copy(
        forward
    ).multiplyScalar(
        player.speed
    );


    // ========================================================
    // POSITION
    // ========================================================

    player.position.add(
        player.velocity
            .clone()
            .multiplyScalar(delta)
    );


    // ========================================================
    // KART TRANSFORM
    // ========================================================

    kart.position.copy(
        player.position
    );

    kart.position.y =
        0.05;


    kart.rotation.y =
        player.heading;


    // ========================================================
    // GRASS RECOVERY / RESPAWN
    // ========================================================

    if (
        player.position.length() >
        150
    ) {

        respawnPlayer();
    }
}


// ============================================================
// RESPAWN
// ============================================================

function respawnPlayer() {

    player.position.copy(
        player.spawnPosition
    );

    player.heading =
        player.spawnHeading;

    player.speed = 0;

    player.velocity.set(
        0,
        0,
        0
    );

    kart.position.copy(
        player.position
    );

    kart.rotation.y =
        player.heading;
}


// ============================================================
// CAMERA
// ============================================================

const cameraOffset =
    new THREE.Vector3(
        0,
        7,
        -12
    );


function updateCamera(delta) {

    const desiredPosition =
        new THREE.Vector3(
            0,
            5.8,
            -11
        );


    desiredPosition.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        player.heading
    );


    desiredPosition.add(
        player.position
    );


    const smoothing =
        1 -
        Math.pow(
            0.001,
            delta
        );


    camera.position.lerp(
        desiredPosition,
        smoothing
    );


    const lookTarget =
        player.position
            .clone();


    lookTarget.y += 1.5;


    camera.lookAt(
        lookTarget
    );
}


// ============================================================
// RACE SYSTEM
// ============================================================

const TOTAL_LAPS = 3;

let currentLap = 1;

let raceStarted = false;

let raceFinished = false;

let raceStartTime = 0;

let lapStartTime = 0;

let bestLapTime = Infinity;

let previousCheckpoint =
    trackPoints.length - 1;


// ============================================================
// CHECKPOINT SYSTEM
// ============================================================

const checkpointCount =
    trackPoints.length;


function updateCheckpoints() {

    if (
        !raceStarted ||
        raceFinished
    ) {
        return;
    }


    const result =
        getClosestTrackPoint(
            player.position
        );


    const index =
        result.index;


    /*
        The player must move forward around
        the track rather than simply touching
        the finish line repeatedly.
    */

    let difference =
        index -
        previousCheckpoint;


    if (
        difference < 0
    ) {

        difference +=
            checkpointCount;
    }


    if (
        difference > 0 &&
        difference <= 8
    ) {

        previousCheckpoint =
            index;


        /*
            Completing the final checkpoint
            means the player has crossed the
            finish line.
        */

        if (
            previousCheckpoint >
            checkpointCount - 8
        ) {

            completeLap();
        }
    }
}


// ============================================================
// LAP COMPLETION
// ============================================================

function completeLap() {

    if (
        previousCheckpoint <
        checkpointCount - 8
    ) {
        return;
    }


    const now =
        performance.now();


    const lapTime =
        now -
        lapStartTime;


    if (
        lapTime <
        bestLapTime
    ) {

        bestLapTime =
            lapTime;
    }


    bestLapDisplay.textContent =
        formatTime(
            bestLapTime
        );


    if (
        currentLap >=
        TOTAL_LAPS
    ) {

        finishRace();

        return;
    }


    currentLap++;

    lapStartTime =
        now;


    /*
        Move the checkpoint requirement
        back to the beginning of the track.
    */

    previousCheckpoint = 0;


    lapDisplay.textContent =
        `${currentLap} / ${TOTAL_LAPS}`;
}


// ============================================================
// COUNTDOWN
// ============================================================

function startCountdown() {

    let count = 3;


    countdownElement.textContent =
        count;


    const interval =
        setInterval(() => {

            count--;


            if (count > 0) {

                countdownElement.textContent =
                    count;

            } else {

                countdownElement.textContent =
                    "GO!";


                raceStarted = true;

                raceStartTime =
                    performance.now();

                lapStartTime =
                    performance.now();


                setTimeout(() => {

                    countdownElement.textContent =
                        "";

                }, 700);


                clearInterval(
                    interval
                );
            }

        }, 1000);
}


// ============================================================
// FINISH RACE
// ============================================================

function finishRace() {

    raceFinished = true;

    raceStarted = false;


    const totalTime =
        performance.now() -
        raceStartTime;


    finalTime.textContent =
        formatTime(
            totalTime
        );


    finalBestLap.textContent =
        formatTime(
            bestLapTime
        );


    finishScreen.style.display =
        "block";
}


// ============================================================
// TIME FORMAT
// ============================================================

function formatTime(milliseconds) {

    if (
        !Number.isFinite(
            milliseconds
        )
    ) {

        return "--:--.---";
    }


    const totalSeconds =
        milliseconds / 1000;


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        Math.floor(
            totalSeconds % 60
        );


    const millis =
        Math.floor(
            milliseconds % 1000
        );


    return (
        String(minutes)
            .padStart(2, "0")
        +
        ":"
        +
        String(seconds)
            .padStart(2, "0")
        +
        "."
        +
        String(millis)
            .padStart(3, "0")
    );
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    if (
        raceStarted
    ) {

        const elapsed =
            performance.now() -
            raceStartTime;


        timeDisplay.textContent =
            formatTime(
                elapsed
            );
    }


    speedDisplay.textContent =
        Math.round(
            Math.abs(player.speed)
        );


    lapDisplay.textContent =
        `${currentLap} / ${TOTAL_LAPS}`;
}


// ============================================================
// RESTART
// ============================================================

function restartRace() {

    currentLap = 1;

    raceStarted = false;

    raceFinished = false;

    raceStartTime = 0;

    lapStartTime = 0;

    bestLapTime = Infinity;

    previousCheckpoint =
        trackPoints.length - 1;


    lapDisplay.textContent =
        `1 / ${TOTAL_LAPS}`;


    timeDisplay.textContent =
        "00:00.000";


    bestLapDisplay.textContent =
        "--:--.---";


    speedDisplay.textContent =
        "0";


    finishScreen.style.display =
        "none";


    setStartingPosition();


    camera.position.set(
        player.position.x,
        player.position.y + 6,
        player.position.z - 12
    );


    updateCamera(1);


    startCountdown();
}


restartButton.addEventListener(
    "click",
    restartRace
);


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );
    }
);


// ============================================================
// CLOCK
// ============================================================

const clock =
    new THREE.Clock();


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop() {

    requestAnimationFrame(
        gameLoop
    );


    /*
        Clamp delta so the physics does not
        explode if the browser tab freezes.
    */

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    updatePhysics(delta);

    updateCheckpoints();

    updateCamera(delta);

    updateHUD();


    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// INITIAL CAMERA
// ============================================================

camera.position.set(
    player.position.x,
    player.position.y + 6,
    player.position.z - 12
);

camera.lookAt(
    player.position
);


// ============================================================
// START GAME
// ============================================================

gameLoop();

startCountdown();
```
