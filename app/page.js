'use client'

import { useEffect, useState, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import * as THREE from 'three';
import * as d3 from 'd3';

let hasCheckedIntersections = false;

export default function MyApp() {
  const [intersectionData, setIntersectionData] = useState([]);

  useEffect(() => {
    // setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // dome
    const domeGeometry = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    scene.add(dome);

    // Add drag controls
    const objects = [dome];
    const dragControls = new DragControls(objects, camera, renderer.domElement);

    dragControls.addEventListener("drag", (event) => {
      dome.position.y = 0;
    });

    // Disable orbit controls when dragging the dome
    dragControls.addEventListener('dragstart', function (event) {
      controls.enabled = false;
    });

    // Enable orbit controls when dragging has stopped
    dragControls.addEventListener('dragend', function (event) {
      controls.enabled = true;
      checkIntersections();
    });

    // cube
    const cubeGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.FrontSide});
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 0, 2);  
    scene.add(cube);

    // grid
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // create an array of directions for the rays
    const directions = {};
 
    for (let azimuth = 0; azimuth <= 360; azimuth += 2) {
        for (let elevation = 0; elevation <= 90; elevation += 1) {
            const theta = THREE.MathUtils.degToRad(azimuth); // azimuth
            const phi = THREE.MathUtils.degToRad(90 - elevation); // elevation

            const direction = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta)
            );
            
            directions[`Azimuth${azimuth}Elevation${elevation}`] = direction;
        }
    }

    // create a raycaster
    const raycaster = new THREE.Raycaster();

    // create an array to hold arrow helpers
    // const arrows = [];

    // function to check intersections
    function checkIntersections() {
      const intersectionDataArray = [];

      // // remove old arrow helpers
      // for (let arrow of arrows) {
      //   scene.remove(arrow);
      // }
      // arrows.length = 0;

      for (const [name, direction] of Object.entries(directions)) {
        raycaster.set(dome.position, direction);

        const intersects = raycaster.intersectObject(cube);

        // // create an arrow helper to visualize the direction of the ray
        // const arrowHelper = new THREE.ArrowHelper(direction, dome.position, 3, 0xff0000);
        // scene.add(arrowHelper);
        // arrows.push(arrowHelper);

        if (intersects.length > 0) {
          console.log(`Ray named ${name} in direction ${direction.toString()} intersects the cube`);

          // calculate the position intersect on the dome
          const pointOnDome = intersects[0].point.clone().normalize();

          // calculate azimuth and elevation in degrees
          const sphericalCoords = new THREE.Spherical().setFromVector3(direction);
          let azimuth = sphericalCoords.theta * 180 / Math.PI;
          const elevation = (Math.PI / 2 - sphericalCoords.phi) * 180 / Math.PI;

          // correct azimuth to be within 0 and 360 degrees
          if (azimuth < 0) {
            azimuth += 360;
          }

          console.log(`Azimuth: ${azimuth}, Elevation: ${elevation}`);

          intersectionDataArray.push({ azimuth: azimuth, elevation: elevation });
        } else {
          console.log(`Ray named ${name} in direction ${direction.toString()} does not intersect the cube`);
        }
      }

      setIntersectionData(intersectionDataArray);
    }

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      
      if (!hasCheckedIntersections) {
        checkIntersections();
        hasCheckedIntersections = true;
      }
    };

    animate();

  }, []);

  return <div><MyGraph data={intersectionData} /></div>
};

function MyGraph({ data }) {
  // Créez une référence à l'élément DOM que nous allons utiliser pour le graphique
  const ref = useRef();

  useEffect(() => {
    // Dimensions de notre graphique
    const width = 900;
    const height = 500;
    const margin = {top: 50, right: 50, bottom: 50, left: 50};

    // Créez un nouveau SVG avec les dimensions données
    const svg = d3.select(ref.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Créez une échelle pour l'azimut et l'élévation
    const xScale = d3.scaleLinear()
        .domain([0, 360]) // Azimuth varie de 0 à 360 degrés
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 90]) // L'élévation varie de 0 à 90 degrés
        .range([height, 0]); // Notez que le sens est inversé pour correspondre à la convention de l'axe des y

    // Créez les axes
    const xAxis = d3.axisBottom(xScale)
        .tickValues([0, 90, 180, 270, 360])
        .tickFormat(d => {
            switch(d) {
                case 0:
                    return 'N';
                case 90:
                    return 'W';
                case 180:
                    return 'S';
                case 270:
                    return 'E';
                case 360:
                    return 'N';
                default:
                    return d;
            }
        });

    const yAxis = d3.axisLeft(yScale);

    // Ajoutez les axes au SVG
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('color', 'black')
        .call(xAxis);

    svg.append('g')
        .attr('color', 'black')
        .call(yAxis);

    // Supprimez tous les cercles existants
    d3.select(ref.current)
    .selectAll("circle")
    .remove();

    // Créez les cercles pour chaque point de données
    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.azimuth))
        .attr('cy', d => yScale(d.elevation))
        .attr('r', 2)
        .attr('fill', 'blue');
  }, [data]);

    return (
        <div>
            <svg ref={ref} />
        </div>
    );
};
