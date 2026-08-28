import mermaid from "https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs"
import elkLayouts from "https://unpkg.com/@mermaid-js/layout-elk@0.2/dist/mermaid-layout-elk.esm.min.mjs"
import svgPanZoom from "https://esm.sh/svg-pan-zoom@3.6.2"

// Same selectors/custom properties Zensical's own (shadow-DOM-based, non-interactive)
// mermaid renderer uses internally, kept here so diagrams stay visually consistent
// and automatically re-theme with the light/dark toggle - see --md-mermaid-* in
// the generated bundle CSS.
const THEME_CSS = `.node circle,.node ellipse,.node path,.node polygon,.node rect{fill:var(--md-mermaid-node-bg-color);stroke:var(--md-mermaid-node-fg-color)}.marker{fill:var(--md-mermaid-edge-color);stroke:var(--md-mermaid-edge-color)}.edgeLabel .label rect{fill:#0000}.flowchartTitleText{fill:var(--md-mermaid-label-fg-color)}.label{color:var(--md-mermaid-label-fg-color);font-family:var(--md-mermaid-font-family)}.label foreignObject{line-height:normal;overflow:visible}.label div .edgeLabel{color:var(--md-mermaid-label-fg-color)}.edgeLabel,.edgeLabel p,.label div .edgeLabel{background-color:var(--md-mermaid-label-bg-color)}.edgeLabel,.edgeLabel p{fill:var(--md-mermaid-label-bg-color);color:var(--md-mermaid-edge-color)}.edgePath .path,.flowchart-link{stroke:var(--md-mermaid-edge-color)}.edgePath .arrowheadPath{fill:var(--md-mermaid-edge-color);stroke:none}.cluster rect{fill:var(--md-default-fg-color--lightest);stroke:var(--md-default-fg-color--lighter)}.cluster span{color:var(--md-mermaid-label-fg-color);font-family:var(--md-mermaid-font-family)}g #flowchart-circleEnd,g #flowchart-circleStart,g #flowchart-crossEnd,g #flowchart-crossStart,g #flowchart-pointEnd,g #flowchart-pointStart{stroke:none}.classDiagramTitleText{fill:var(--md-mermaid-label-fg-color)}g.classGroup line,g.classGroup rect{fill:var(--md-mermaid-node-bg-color);stroke:var(--md-mermaid-node-fg-color)}g.classGroup text{fill:var(--md-mermaid-label-fg-color);font-family:var(--md-mermaid-font-family)}.classLabel .box{fill:var(--md-mermaid-label-bg-color);background-color:var(--md-mermaid-label-bg-color);opacity:1}.classLabel .label{fill:var(--md-mermaid-label-fg-color);font-family:var(--md-mermaid-font-family)}.node .divider{stroke:var(--md-mermaid-node-fg-color)}.relation{stroke:var(--md-mermaid-edge-color)}.cardinality{fill:var(--md-mermaid-label-fg-color);font-family:var(--md-mermaid-font-family)}.cardinality text{fill:inherit!important}defs marker.marker.composition.class path,defs marker.marker.dependency.class path,defs marker.marker.extension.class path{fill:var(--md-mermaid-edge-color)!important;stroke:var(--md-mermaid-edge-color)!important}defs marker.marker.aggregation.class path{fill:var(--md-mermaid-label-bg-color)!important;stroke:var(--md-mermaid-edge-color)!important}.statediagramTitleText{fill:var(--md-mermaid-label-fg-color)}g.stateGroup rect{fill:var(--md-mermaid-node-bg-color);stroke:var(--md-mermaid-node-fg-color)}g.stateGroup .state-title{fill:var(--md-mermaid-label-fg-color)!important;font-family:var(--md-mermaid-font-family)}g.stateGroup .composit{fill:var(--md-mermaid-label-bg-color)}.nodeLabel,.nodeLabel p{color:var(--md-mermaid-label-fg-color);font-family:var(--md-mermaid-font-family)}a .nodeLabel{text-decoration:underline}.node circle.state-end,.node circle.state-start,.start-state{fill:var(--md-mermaid-edge-color);stroke:none}.end-state-inner,.end-state-outer{fill:var(--md-mermaid-edge-color)}.end-state-inner,.node circle.state-end{stroke:var(--md-mermaid-label-bg-color)}.transition{stroke:var(--md-mermaid-edge-color)}[id^=state-fork] rect,[id^=state-join] rect{fill:var(--md-mermaid-edge-color)!important;stroke:none!important}.statediagram-cluster.statediagram-cluster .inner{fill:var(--md-default-bg-color)}.statediagram-cluster rect{fill:var(--md-mermaid-node-bg-color);stroke:var(--md-mermaid-node-fg-color)}.statediagram-state rect.divider{fill:var(--md-default-fg-color--lightest);stroke:var(--md-default-fg-color--lighter)}defs [id$=-barbEnd]{fill:var(--md-mermaid-edge-color);stroke:var(--md-mermaid-edge-color)}[id^=entity] path,[id^=entity] rect{fill:var(--md-default-bg-color)}.relationshipLine{stroke:var(--md-mermaid-edge-color)}defs .marker.oneOrMore.er *,defs .marker.onlyOne.er *,defs .marker.zeroOrMore.er *,defs .marker.zeroOrOne.er *{stroke:var(--md-mermaid-edge-color)!important}text:not([class]):last-child{fill:var(--md-mermaid-label-fg-color)}.actor{fill:var(--md-mermaid-sequence-actor-bg-color);stroke:var(--md-mermaid-sequence-actor-border-color)}text.actor>tspan{fill:var(--md-mermaid-sequence-actor-fg-color);font-family:var(--md-mermaid-font-family)}.actor-line{stroke:var(--md-mermaid-sequence-actor-line-color)}.actor-man circle,.actor-man line{fill:var(--md-mermaid-sequence-actorman-bg-color);stroke:var(--md-mermaid-sequence-actorman-line-color)}.messageLine0,.messageLine1{stroke:var(--md-mermaid-sequence-message-line-color)}.note{fill:var(--md-mermaid-sequence-note-bg-color);stroke:var(--md-mermaid-sequence-note-border-color)}.loopText,.loopText>tspan,.messageText,.noteText>tspan{stroke:none;font-family:var(--md-mermaid-font-family)!important}.messageText{fill:var(--md-mermaid-sequence-message-fg-color)}.loopText,.loopText>tspan,.sectionTitle{fill:var(--md-mermaid-sequence-loop-fg-color)}.noteText>tspan{fill:var(--md-mermaid-sequence-note-fg-color)}[id$=-arrowhead] path{fill:var(--md-mermaid-sequence-message-line-color);stroke:none}.loopLine{fill:var(--md-mermaid-sequence-loop-bg-color);stroke:var(--md-mermaid-sequence-loop-border-color)}.labelBox{fill:var(--md-mermaid-sequence-label-bg-color);stroke:none}.labelText,.labelText>span{fill:var(--md-mermaid-sequence-label-fg-color);font-family:var(--md-mermaid-font-family)}.sequenceNumber{fill:var(--md-mermaid-sequence-number-fg-color)}rect.rect{fill:var(--md-mermaid-sequence-box-bg-color);stroke:none}rect.rect+text.text{fill:var(--md-mermaid-sequence-box-fg-color)}[id$=-sequencenumber],defs #sequencenumber{fill:var(--md-mermaid-sequence-number-bg-color)!important}[class^=activation]{fill:var(--md-mermaid-label-bg-color);stroke:var(--md-mermaid-label-fg-color);stroke-width:1.5px}`

mermaid.registerLayoutLoaders(elkLayouts)
mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  layout: "elk",
  themeCSS: THEME_CSS,
})

// Important: necessary to make it visible to Zensical
window.mermaid = mermaid

// Rendered ourselves (not via Zensical's built-in pre.mermaid handling) because
// that renders into a *closed* shadow root - inaccessible to svg-pan-zoom or any
// other external script. The custom_fences class in base.yml is "mermaid-zoom"
// (not "mermaid") specifically so Zensical's own handler never claims these blocks.
let counter = 0

document$.subscribe(() => {
  const blocks = document.querySelectorAll("pre.mermaid-zoom")
  blocks.forEach(async (block) => {
    const source = block.textContent
    const id = `mermaid-zoom-${counter++}`

    const container = document.createElement("div")
    container.className = "mermaid-zoom-container"
    const wrapper = document.createElement("div")
    wrapper.className = "mermaid-zoom-wrapper"
    wrapper.appendChild(container)
    block.replaceWith(wrapper)

    try {
      const { svg } = await mermaid.render(id, source)
      container.innerHTML = svg
      const svgEl = container.querySelector("svg")
      svgEl.style.maxWidth = "none"
      svgEl.removeAttribute("height")

      svgPanZoom(svgEl, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
        center: true,
        minZoom: 0.2,
        maxZoom: 15,
        zoomScaleSensitivity: 0.4,
      })
    } catch (err) {
      container.textContent = source
      console.error("Mermaid render failed:", err)
    }
  })
})
