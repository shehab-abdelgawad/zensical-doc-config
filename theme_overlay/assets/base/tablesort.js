document$.subscribe(function () {
  var tables = document.querySelectorAll("article table:not([class])")
  var openPopover = null

  function closeAll() {
    if (openPopover) {
      openPopover.remove()
      openPopover = null
    }
  }

  // Single delegated listeners, set up once per page load
  document.addEventListener("click", function (e) {
    if (openPopover && !openPopover.contains(e.target) &&
        !e.target.closest(".md-table-filter__trigger")) {
      closeAll()
    }
  })
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll()
  })
  window.addEventListener("scroll", closeAll, true)
  window.addEventListener("resize", closeAll)

  tables.forEach(function (table) {
    if (table.dataset.filterable) return
    table.dataset.filterable = "true"

    var thead = table.tHead
    var tbody = table.tBodies[0]
    if (!thead || !tbody) return

    var headerCells = Array.prototype.slice.call(thead.rows[0].cells)
    var rows = Array.prototype.slice.call(tbody.rows)

    var override = null
    var wrapper = table.closest("[data-filter-types]")
    if (wrapper) {
      override = wrapper.getAttribute("data-filter-types")
        .split(",").map(function (s) { return s.trim() })
    }

    function parseNumeric(text) {
      var match = String(text).replace(/,/g, "").match(/-?\d+(\.\d+)?/)
      return match ? parseFloat(match[0]) : NaN
    }

    var columnTypes = headerCells.map(function (_, colIndex) {
      if (override && override[colIndex] && override[colIndex] !== "auto") {
        return override[colIndex]
      }
      var sample = rows
        .map(function (row) { return row.cells[colIndex] })
        .filter(Boolean)
        .map(function (cell) { return cell.textContent.trim() })
        .filter(function (text) { return text.length > 0 })

      if (sample.length === 0) return "text"
      var numericCount = sample.filter(function (text) {
        return !isNaN(parseNumeric(text))
      }).length

      return numericCount / sample.length >= 0.8 ? "number" : "text"
    })

    var filters = {}

    function applyFilters() {
      var visible = 0
      rows.forEach(function (row) {
        var match = Object.keys(filters).every(function (colIndex) {
          var f = filters[colIndex]
          var cell = row.cells[colIndex]
          if (!cell) return true
          var text = cell.textContent.trim()

          if (columnTypes[colIndex] === "number") {
            var num = parseNumeric(text)
            if (isNaN(num)) return false
            switch (f.op) {
              case ">":  return num >  f.value
              case ">=": return num >= f.value
              case "<":  return num <  f.value
              case "<=": return num <= f.value
              case "=":  return num === f.value
            }
          } else {
            var haystack = text.toLowerCase()
            var needle = String(f.value).toLowerCase()
            var contains = haystack.indexOf(needle) !== -1
            return f.op === "contains" ? contains : !contains
          }
          return true
        })
        row.hidden = !match
        if (match) visible++
      })
      table.hidden = visible === 0
    }

    headerCells.forEach(function (th, colIndex) {
      var trigger = document.createElement("button")
      trigger.type = "button"
      trigger.className = "md-table-filter__trigger"
      trigger.setAttribute("aria-label", "Filter column")
      trigger.innerHTML =
        '<svg viewBox="0 0 24 24" width="14" height="14">' +
        '<path fill="currentColor" d="M3 4h18v2l-7 8v6l-4-2v-4L3 6z"/></svg>'
      th.appendChild(trigger)

      trigger.addEventListener("click", function (e) {
        e.stopPropagation()

        // Toggle: if this trigger's popover is already open, close it
        if (openPopover && openPopover.dataset.forColumn === String(colIndex) &&
            openPopover.dataset.forTable === table.dataset.filterId) {
          closeAll()
          return
        }
        closeAll()
        openPopoverFor(trigger, colIndex)
      })
    })

    if (!table.dataset.filterId) {
      table.dataset.filterId = Math.random().toString(36).slice(2)
    }

    function openPopoverFor(trigger, colIndex) {
      var popover = document.createElement("div")
      popover.className = "md-table-filter__popover"
      popover.dataset.forColumn = String(colIndex)
      popover.dataset.forTable = table.dataset.filterId
      popover.addEventListener("click", function (e) { e.stopPropagation() })

      var select = document.createElement("select")
      var input = document.createElement("input")
      input.placeholder = "Value…"

      if (columnTypes[colIndex] === "number") {
        [">", ">=", "<", "<=", "="].forEach(function (op) {
          var opt = document.createElement("option")
          opt.value = op
          opt.textContent = op
          select.appendChild(opt)
        })
        input.type = "number"
      } else {
        [["contains", "contains"], ["not-contains", "does not contain"]]
          .forEach(function (pair) {
            var opt = document.createElement("option")
            opt.value = pair[0]
            opt.textContent = pair[1]
            select.appendChild(opt)
          })
        input.type = "text"
      }

      var existing = filters[colIndex]
      if (existing) {
        select.value = existing.op
        input.value = existing.value
      }

      var actions = document.createElement("div")
      actions.className = "md-table-filter__actions"

      var clear = document.createElement("button")
      clear.type = "button"
      clear.className = "md-table-filter__clear"
      clear.textContent = "Clear"

      var close = document.createElement("button")
      close.type = "button"
      close.className = "md-table-filter__close"
      close.setAttribute("aria-label", "Close filter")
      close.textContent = "✕"

      actions.appendChild(clear)
      actions.appendChild(close)
      popover.appendChild(select)
      popover.appendChild(input)
      popover.appendChild(actions)
      document.body.appendChild(popover)

      // Position via fixed coords, clamped to viewport
      var rect = trigger.getBoundingClientRect()
      var popRect = popover.getBoundingClientRect()
      var left = Math.min(rect.left, window.innerWidth - popRect.width - 8)
      popover.style.top = rect.bottom + 4 + "px"
      popover.style.left = Math.max(8, left) + "px"

      function updateFilter() {
        if (input.value === "") {
          delete filters[colIndex]
        } else {
          filters[colIndex] = { op: select.value, value: columnTypes[colIndex] === "number"
            ? parseNumeric(input.value) : input.value }
        }
        headerCells[colIndex].querySelector(".md-table-filter__trigger")
          .classList.toggle("md-table-filter__trigger--active", !!filters[colIndex])
        applyFilters()
      }

      input.addEventListener("input", updateFilter)
      select.addEventListener("change", updateFilter)
      clear.addEventListener("click", function () {
        input.value = ""
        updateFilter()
        closeAll()
      })
      close.addEventListener("click", closeAll)

      input.focus()
      openPopover = popover
    }
  })
})