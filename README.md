# RoboTruck / UFO Project

A scene with a robot/truck and a trailer and a scene with a UFO in the countryside in ThreeJS as a project for the Computer Graphics course (LEIC-A @ IST 22/23)

### Made by

| Name               | IST ID    | E-mail                              |
|--------------------|-----------|-------------------------------------|
| João Cardoso       | ist199251 | joao.n.m.cardoso@tecnico.ulisboa.pt |
| José João Ferreira | ist199259 | josejoaoferreira@tecnico.ulisboa.pt |
| Tiago Quinteiro    | ist199336 | tiagoquinteiro@tecnico.ulisboa.pt   |

### Repository

- Public repository available at [GitHub](https://github.com/jjasferreira/robotruck-ufo-js)

---

## Sketches, views and scene graphs (Delivery A)

- [Requirements](deliveries/A.pdf)
- [Files](assets)

### Estimated effort per student

| Name               | Estimated effort |
|--------------------|------------------|
| João Cardoso       | 5 hours          |
| José João Ferreira | 5 hours          |
| Tiago Quinteiro    | 5 hours          |

---

## RoboTruck Scene (Delivery B)

- [Requirements](deliveries/B.pdf)
- [Scene](robotruck.html)
- [Source code](js/robotruck.js)

### Estimated effort per student

| Name               | Estimated effort |
|--------------------|------------------|
| João Cardoso       | 16 hours         |
| José João Ferreira | 16 hours         |
| Tiago Quinteiro    | 16 hours         |

### Key bindings

- Camera Controls
  - `1` - change camera to front view
  - `2` - change camera to side view
  - `3` - change camera to top view
  - `4` - change camera to isometric view
  - `5` - change camera to perspective view
  - `C` - toggle camera controls


- Visual Representation
  - `6` - toggle wireframe visibility
  - `7` - toggle edges visibility
  - `8` - toggle bounding boxes visibility
  - `9` - toggle axes helper visibility


- RoboTruck Controls
  - `R/F` - rotate RoboTruck's head
  - `E/D` - move RoboTruck's arms
  - `W/S` - rotate RoboTruck's thighs
  - `Q/A` - rotate RoboTruck's boots


- Trailer Controls
  - `←/→` - move Trailer on x-axis
  - `↑/↓` - move Trailer on z-axis
  - `Z` - reset Trailer's position and latches rotation

---

## UFO Scene (Delivery C)

- [Requirements](deliveries/C.pdf)
- [Scene](ufo.html)
- [Source code](js/ufo.js)

### Estimated effort per student

| Name               | Estimated effort |
|--------------------|------------------|
| João Cardoso       | 20 hours         |
| José João Ferreira | 20 hours         |
| Tiago Quinteiro    | 20 hours         |

### Key bindings

- Texture Generation
  - `1` - generate new terrain texture
  - `2` - generate new sky texture


- Materials Update
  - `Q` - change materials to lambert
  - `W` - change materials to phong
  - `E` - change materials to toon
  - `R` - change materials to basic


- Lights Toggling
  - `D` - toggle moon directional light visibility
  - `P` - toggle cylinder spotlight visibility
  - `S` - toggle bauble point lights visibility


- Camera Controls
  - `C` - toggle camera controls


- Visual Representation
  - `6` - toggle wireframe visibility
  - `7` - toggle edges visibility
  - `8` - toggle light helper visibility
  - `9` - toggle axes helper visibility


- Debugging
  - `0` - display triangles count
  - `M` - toggle debug messages mode


- UFO Controls
  - `←/→` - move UFO on x-axis
  - `↑/↓` - move UFO on z-axis