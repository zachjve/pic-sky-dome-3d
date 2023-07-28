'use client'

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function MyGraph() {
    // Créez une référence à l'élément DOM que nous allons utiliser pour le graphique
    const ref = useRef();

    // Données statiques pour l'azimut et l'élévation
    const data = [
        {azimuth: 0, elevation: 0},
        {azimuth: 90, elevation: 30},
        {azimuth: 180, elevation: 60},
        {azimuth: 270, elevation: 90},
        // Ajoutez autant de points que nécessaire
    ];

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
                        return 'E';
                    case 180:
                        return 'S';
                    case 270:
                        return 'W';
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

        // Créez les cercles pour chaque point de données
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.azimuth))
            .attr('cy', d => yScale(d.elevation))
            .attr('r', 5)
            .attr('fill', 'blue');
    }, []);

    return (
        <div>
            <svg ref={ref} />
        </div>
    );
};

