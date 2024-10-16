import { useRef, useEffect, useState, memo } from "react";
// d3
import * as d3 from "d3";
// antd
import { Button } from "antd";

type LineChartProps<T> = {
  label: string,
  value: string,
  width: number,
  height: number,
  data: T[]
}

function LineChart<T>({ data, label, value, width, height }): React.FC<LineChartProps<T>> {
  const [options, setOptions] = useState({ zoomAble: false, crossAir: false }); // state for controlling the ui
  const svgRef = useRef(); // svg reference for adding every layer or line we need
  const isCrosshairActive = useRef(false); // controlling crossair avtivity
  const isZoomActive = useRef(false); // controlling zoom avtivity
  const crosshairLinesRef = useRef({ vertical: null, horizontal: null }); // keep crossair v & h for keep ui realtime
  const crosshairGroupRef = useRef(null); // for keep and cache v & h
  const mousePosition = useRef({ x: null, y: null }); // save mouse postion for prevent blinking crossair

  // ui constants
  const margin = { top: 10, right: 30, bottom: 30, left: 60 };
  // chart size
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    const svgElement = d3.select(svgRef.current); // get svg refrence for go on it
    svgElement.selectAll("*").remove(); // remove the item if be in the svg

    const svg = svgElement
      .attr("width", chartWidth + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(data.length ? d3.extent(data, d => d[label]) : [0, 10])
      .range([0, chartWidth]);
    const y = d3.scaleLinear()
      .domain(data.length ? d3.extent(data, d => d[value]) : [0, 10])
      .range([chartHeight, 0]);

    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x));
    const yAxis = svg.append("g").call(d3.axisLeft(y));

    // Add grid lines for x-axis
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(-chartHeight).tickFormat(""));

    // Add grid lines for y-axis
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-chartWidth).tickFormat(""));

    // Define clipping path
    svg.append("defs").append("clipPath").attr("id", "clip").append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight);

    const line = d3.line()
      .x(d => x(d[label]))
      .y(d => y(d[value]))
      .curve(d3.curveCardinal);

    // Use clipping path for the scatter group
    const scatter = svg.append("g").attr("clip-path", "url(#clip)");
    if (data.length) {
      scatter.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#61a3a9")
        .attr("stroke-width", 2)
        .attr("d", line);
    }

    // add zoom option
    const zoom = d3.zoom()
      .scaleExtent([0, 20])
      .extent([[0, 0], [chartWidth, chartHeight]])
      .on("zoom", (event) => updateChart(event));

    svg.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .style("fill", "none")
      .style("pointer-events", "all")
      .call(zoom)
      .on("mousemove", handleMouseMove).on("mouseleave", handleMouseLeave);

    // add crossair
    const crosshairGroup = svg.append("g").style("opacity", 0);
    crosshairGroupRef.current = crosshairGroup;
    crosshairLinesRef.current.vertical = crosshairGroup.append("line")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("y1", 0)
      .attr("y2", chartHeight);

    crosshairLinesRef.current.horizontal = crosshairGroup.append("line")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("x1", 0)
      .attr("x2", chartWidth);

    function updateChart(event) {
      if (isZoomActive.current) {
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);

        xAxis.call(d3.axisBottom(newX));
        yAxis.call(d3.axisLeft(newY));

        if (data.length) {
          scatter.select("path")
            .attr("d", line.x(d => newX(d[label])).y(d => newY(d[value])));
        }
      }
    }

    // Handle mouse move to update crosshair
    function handleMouseMove(event) {
      if (isCrosshairActive.current) {
        const [mouseX, mouseY] = d3.pointer(event);
        mousePosition.current = { x: mouseX, y: mouseY };

        // Update crosshair position
        crosshairLinesRef.current.vertical.attr("x1", mouseX).attr("x2", mouseX);
        crosshairLinesRef.current.horizontal.attr("y1", mouseY).attr("y2", mouseY);

        // Make sure the crosshair is visible
        crosshairGroup.style("opacity", 1);
      }
    }

    // Handle mouse leave to hide crosshair
    function handleMouseLeave() {
      // crosshairGroupRef.current.style("opacity", 0); // Hide crosshair
    }


    return () => {
      svgElement.selectAll("*").remove();
    };
  }, [data]);

  return (
    <div id="dataviz_axisZoom" className="flex flex-col items-center justify-center h-full">
      {/* svg container */}
      <svg ref={svgRef}>
        <text id="tooltip" fontSize="12px" fill="black" style={{ display: "none" }}></text>
      </svg>
      {/* chart controller */}
      <div className="flex mt-10 gap-x-4">
        <Button onClick={() => {
          isCrosshairActive.current = !isCrosshairActive.current;
          setOptions(prev => ({ ...prev, crossAir: !prev.crossAir }));
          if (isCrosshairActive.current === false) {
            crosshairGroupRef.current.style("opacity", 0); // Hide crosshair
          }
        }}>
          {options.crossAir ? "Disable" : "Enable"} Crosshair
        </Button>
        <Button onClick={() => {
          isZoomActive.current = !isZoomActive.current;
          setOptions(prev => ({ ...prev, zoomAble: !prev.zoomAble }));
        }}>
          {options.zoomAble ? "Disable" : "Enable"} Zoom
        </Button>
      </div>
    </div>
  );
};

export default memo(LineChart);
