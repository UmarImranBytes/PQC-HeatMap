import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Typography,
    Paper,

    CircularProgress,
} from "@mui/material";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { GeoPermissibleObjects } from "d3";

// ─── Score data (ISO-3166 Alpha-3 → 0-100) ────────────────────────────────────
const pqcScores: Record<string, number> = {
    USA: 95, GBR: 92, DEU: 90, FRA: 88, JPN: 87, AUS: 85, CAN: 93,
    NLD: 89, SWE: 91, NOR: 90, CHE: 88, DNK: 87, FIN: 86, ISR: 84,
    KOR: 82, SGP: 86, NZL: 83, AUT: 85, BEL: 84, IRL: 82, LUX: 80,
    CHN: 75, RUS: 70, IND: 65, BRA: 55, MEX: 52, ZAF: 48, ARG: 50,
    TUR: 60, POL: 72, CZE: 74, HUN: 68, ROU: 62, BGR: 58, SVK: 65,
    HRV: 60, SVN: 66, EST: 80, LVA: 75, LTU: 74, PRT: 70, ESP: 72,
    ITA: 68, GRC: 60, UKR: 55, BLR: 45, KAZ: 40, UZB: 35, AZE: 38,
    GEO: 42, ARM: 40, MDA: 38, IRN: 45, IRQ: 30, SAU: 65, ARE: 70,
    QAT: 68, KWT: 62, BHR: 60, OMN: 55, YEM: 15, SYR: 12, LBY: 18,
    TUN: 40, MAR: 42, DZA: 38, EGY: 45, SDN: 20, ETH: 22, KEN: 35,
    NGA: 30, GHA: 32, CIV: 28, SEN: 30, TZA: 25, MOZ: 18, ZMB: 22,
    ZWE: 20, MDG: 15, AGO: 20, CMR: 25, COD: 12, CAF: 10, TCD: 12,
    MLI: 15, NER: 12, BFA: 18, GIN: 16, SLE: 14, LBR: 15, SOM: 8,
    ERI: 10, DJI: 22, RWA: 30, UGA: 28, TGO: 20, BEN: 22, MWI: 18,
    LSO: 16, SWZ: 18, BWA: 35, NAM: 32, PAK: 40, BGD: 35, LKA: 42,
    NPL: 28, MMR: 30, KHM: 32, LAO: 28, VNM: 55, THA: 62, MYS: 68,
    IDN: 60, PHL: 58, COL: 55, VEN: 30, ECU: 45, PER: 48, BOL: 38,
    PRY: 35, URY: 60, CHL: 65, GTM: 38, HND: 30, SLV: 32, NIC: 28,
    CRI: 55, PAN: 50, CUB: 35, DOM: 42, HTI: 18, JAM: 40, TTO: 48,
    BLZ: 30, GUY: 32, SUR: 30, PRK: 5, MNG: 35, TKM: 30, KGZ: 32,
    TJK: 28, AFG: 10, BTN: 30, MDV: 35,
};

// ─── Numeric country ID → ISO Alpha-3 lookup ─────────────────────────────────
const numericToA3: Record<number, string> = {
    840: "USA", 826: "GBR", 276: "DEU", 250: "FRA", 392: "JPN", 36: "AUS",
    124: "CAN", 528: "NLD", 752: "SWE", 578: "NOR", 756: "CHE", 208: "DNK",
    246: "FIN", 376: "ISR", 410: "KOR", 702: "SGP", 554: "NZL", 40: "AUT",
    56: "BEL", 372: "IRL", 442: "LUX", 156: "CHN", 643: "RUS", 356: "IND",
    76: "BRA", 484: "MEX", 710: "ZAF", 32: "ARG", 792: "TUR", 616: "POL",
    203: "CZE", 348: "HUN", 642: "ROU", 100: "BGR", 703: "SVK", 191: "HRV",
    705: "SVN", 233: "EST", 428: "LVA", 440: "LTU", 620: "PRT", 724: "ESP",
    380: "ITA", 300: "GRC", 804: "UKR", 112: "BLR", 398: "KAZ", 860: "UZB",
    31: "AZE", 268: "GEO", 51: "ARM", 498: "MDA", 364: "IRN", 368: "IRQ",
    682: "SAU", 784: "ARE", 634: "QAT", 414: "KWT", 48: "BHR", 512: "OMN",
    887: "YEM", 760: "SYR", 434: "LBY", 788: "TUN", 504: "MAR", 12: "DZA",
    818: "EGY", 729: "SDN", 231: "ETH", 404: "KEN", 566: "NGA", 288: "GHA",
    384: "CIV", 686: "SEN", 834: "TZA", 508: "MOZ", 894: "ZMB", 716: "ZWE",
    450: "MDG", 24: "AGO", 120: "CMR", 180: "COD", 140: "CAF", 148: "TCD",
    466: "MLI", 562: "NER", 854: "BFA", 324: "GIN", 694: "SLE", 430: "LBR",
    706: "SOM", 232: "ERI", 262: "DJI", 646: "RWA", 800: "UGA", 768: "TGO",
    204: "BEN", 454: "MWI", 426: "LSO", 748: "SWZ", 72: "BWA", 516: "NAM",
    586: "PAK", 50: "BGD", 144: "LKA", 524: "NPL", 104: "MMR", 116: "KHM",
    418: "LAO", 704: "VNM", 764: "THA", 458: "MYS", 360: "IDN", 608: "PHL",
    170: "COL", 862: "VEN", 218: "ECU", 604: "PER", 68: "BOL", 600: "PRY",
    858: "URY", 152: "CHL", 320: "GTM", 340: "HND", 222: "SLV", 558: "NIC",
    188: "CRI", 591: "PAN", 192: "CUB", 214: "DOM", 332: "HTI", 388: "JAM",
    780: "TTO", 84: "BLZ", 328: "GUY", 740: "SUR", 408: "PRK", 496: "MNG",
    795: "TKM", 417: "KGZ", 762: "TJK", 4: "AFG", 64: "BTN", 462: "MDV",
};

// ─── Color scale: dark red → dark green ──────────────────────────────────────
function scoreToColor(score: number | undefined): string {
    if (score === undefined) return "#B0BEC5";
    const colorScale = d3
        .scaleLinear<string>()
        .domain([0, 20, 40, 60, 80, 100])
        .range(["#8B0000", "#CC3300", "#E8651A", "#F5A623", "#5ABF3C", "#1A7A1A"])
        .clamp(true);
    return colorScale(score);
}

// ─── Legend component ─────────────────────────────────────────────────────────
const Legend: React.FC = () => {
    const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Not Ready</Typography>
                <Typography variant="caption" color="text.secondary">Fully Ready</Typography>
            </Box>
            <Box
                sx={{
                    height: 16,
                    borderRadius: 1,
                    background:
                        "linear-gradient(to right, #8B0000, #CC3300, #E8651A, #F5A623, #C8D400, #5ABF3C, #1A7A1A)",
                }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                {ticks.map((t) => (
                    <Typography key={t} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                        {t}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

// ─── Tooltip state ─────────────────────────────────────────────────────────────
interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    country: string;
    score: number | undefined;
}

// ─── Main component ───────────────────────────────────────────────────────────
const PQCHeatmap: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [loading, setLoading] = useState(true);
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false, x: 0, y: 0, country: "", score: undefined,
    });

    useEffect(() => {
        const width = 960;
        const height = 480;

        const projection = d3
            .geoNaturalEarth1()
            .scale(153)
            .translate([width / 2, height / 2]);

        const pathGenerator = d3.geoPath().projection(projection);

        const svg = d3
            .select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("width", "100%")
            .style("display", "block");

        // Ocean background
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#C8DFF0");

        type WorldTopology = Topology<{
            countries: GeometryCollection;
            land: GeometryCollection;
        }>;

        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then((res) => res.json())
            .then((world: WorldTopology) => {
                const countries = topojson.feature(world, world.objects.countries);
                const borders = topojson.mesh(
                    world,
                    world.objects.countries,
                    (a, b) => a !== b
                );

                // Draw countries
                svg
                    .selectAll<SVGPathElement, GeoJSON.Feature>("path.country")
                    .data((countries as GeoJSON.FeatureCollection).features)
                    .enter()
                    .append("path")
                    .attr("class", "country")
                    .attr("d", (d) => pathGenerator(d as GeoPermissibleObjects) ?? "")
                    .attr("fill", (d) => {
                        const a3 = numericToA3[Number(d.id)];
                        return scoreToColor(a3 ? pqcScores[a3] : undefined);
                    })
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 0.4)
                    .style("cursor", "pointer")
                    .on("mousemove", function (event: MouseEvent, d) {
                        const a3 = numericToA3[Number(d.id)];
                        const rect = svgRef.current!.getBoundingClientRect();
                        setTooltip({
                            visible: true,
                            x: event.clientX - rect.left + 12,
                            y: event.clientY - rect.top - 10,
                            country: a3 ?? "Unknown",
                            score: a3 ? pqcScores[a3] : undefined,
                        });
                        d3.select(this).attr("opacity", 0.72).attr("stroke-width", 1.2);
                    })
                    .on("mouseleave", function () {
                        setTooltip((prev) => ({ ...prev, visible: false }));
                        d3.select(this).attr("opacity", 1).attr("stroke-width", 0.4);
                    });

                // Draw borders
                svg
                    .append("path")
                    .datum(borders as GeoPermissibleObjects)
                    .attr("fill", "none")
                    .attr("stroke", "rgba(255,255,255,0.45)")
                    .attr("stroke-width", 0.3)
                    .attr("d", pathGenerator);

                setLoading(false);
            });
    }, []);

    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                borderRadius: 3,
                maxWidth: 1100,
                mx: "auto",
                mt: 4,
                fontFamily: "Roboto, sans-serif",
            }}
        >
            {/* Header */}
            <Typography variant="h5" gutterBottom>
                PQC Readiness Heatmap
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Post-Quantum Cryptography readiness score by country (0 = not ready · 100 = fully ready).
                Hover a country for details.
            </Typography>

            {/* Map */}
            <Box
                sx={{
                    position: "relative",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                    background: "#C8DFF0",
                }}
            >
                {loading && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255,255,255,0.7)",
                            zIndex: 5,
                        }}
                    >
                        <CircularProgress size={36} />
                    </Box>
                )}

                <svg ref={svgRef} />

                {/* Floating tooltip */}
                {tooltip.visible && (
                    <Box
                        sx={{
                            position: "absolute",
                            left: tooltip.x,
                            top: tooltip.y,
                            pointerEvents: "none",
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.75,
                            boxShadow: 3,
                            zIndex: 10,
                        }}
                    >
                        <Typography variant="subtitle2" >
                            {tooltip.country}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            PQC Score:{" "}
                            <Box
                                component="span"

                                color={scoreToColor(tooltip.score)}
                            >
                                {tooltip.score !== undefined ? tooltip.score : "No data"}
                            </Box>
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Legend */}
            <Legend />

            {/* No-data indicator */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                <Box
                    sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: "#B0BEC5", flexShrink: 0 }}
                />
                <Typography variant="caption" color="text.secondary">
                    No data available
                </Typography>
            </Box>
        </Paper>
    );
};

export default PQCHeatmap;
