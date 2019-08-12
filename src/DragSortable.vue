<template>
  <div class="drag-sortable"
    :class="{ dragging, reversing, anim: value.status == 'moving' }"
    :style="[marginStyle, rootStyle]"
    @mousedown="startFn" @touchstart="startFn"
    @click="onClick"
    @transitionend="onTransEnd"
  >
    <slot/>
  </div>
</template>

<script>
let lockPrevTimer
export default {
  props: {
    value: {
      default () {
        return {}
      }
    },
    index: 0,
    dragDirection: null,
    replaceDirection: {
      default () {
        return 'vertical'
      }
    }
  },
  data () {
    return {
      preventClick: false,
      moveLockCount: 5,
      scrollHeight: 0,
      overlapping: false,
      reversing: false,
      dragging: false,
      newIndex: null,
      position: {
        top: 0,
        left: 0,
        offsetX: 0,
        offsetY: 0
      },
      dragData: {
        startX: 0,
        startY: 0,
        pageX: 0,
        pageY: 0
      }
    }
  },
  computed: {
    marginStyle () {
      const { dragging, replaceDirection, value, index } = this
      const { activeInstance, currentIndex, width, height } = value

      const marginPrev = index == 0 && index == currentIndex || currentIndex == 0 && index == 1 && activeInstance.index == 0
      const marginNext = index == currentIndex - 1

      const styles = {
        horizontal: {
          marginLeft: marginPrev ? `${width}px` : null,
          marginRight: marginNext ? `${width}px` : null
        },
        vertical: {
          marginTop: marginPrev ? `${height}px` : null,
          marginBottom: marginNext ? `${height}px` : null
        }
      }
      return !dragging ? styles[replaceDirection] : null
    },
    rootStyle ()  {
      const { dragging, position } = this

      const draggingStyle = {
        position: dragging ? 'absolute' : null,
        top: (position.top + position.offsetY) + 'px',
        left: (position.left + position.offsetX) + 'px'
      }

      return dragging ? draggingStyle : {}
    }
  },
  watch: {
    value (curVal) {
      const { replaceDirection, index, $el } = this
      const { activeInstance, currentIndex, status } = curVal

      if (status == 'moving' && this !== activeInstance) {
        const position = this.getPosition()
        const overlapping = this.judgeOverlap(curVal, position, replaceDirection)
        if (overlapping) {
          let newIndex = overlapping == 'a' ? (index + 1) : index
          if (newIndex == activeInstance.index + 1) {
            newIndex --
          }
          const timeDelta = new Date().getTime() - (lockPrevTimer || 0)
          if (currentIndex != newIndex && timeDelta > 10) {
            lockPrevTimer = new Date().getTime()
            this.updateValue({
              ...curVal,
              currentIndex: newIndex
            })
          }
        }
      }

      if (status == 'release') {
        const position = activeInstance.position
        activeInstance.reversing = true
        if (currentIndex == index + 1) {
          const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = $el
          const revertY = replaceDirection == 'vertical' ? offsetHeight : 0
          const revertX = replaceDirection == 'horizontal' ? offsetWidth : 0

          const yVal = offsetTop + revertY - position.top
          const xVal = offsetLeft + revertX - position.left
          if (
            position.offsetY == yVal &&
            position.offsetX == xVal
          ) {
            activeInstance.onTransEnd()
          }
          position.offsetY = yVal
          position.offsetX = xVal
        }
        else if (currentIndex == 0 && this.index == 0) {
          if (
            position.offsetY == -position.top &&
            position.offsetX == -position.left
          ) {
            activeInstance.onTransEnd()
          }
          position.offsetY = -position.top
          position.offsetX = -position.left
        }
      }

      if (activeInstance === this) {
        const { position, $el } = this
        const list = $el.offsetParent
        const { scrollTop, offsetHeight } = list
        if (curVal.top - scrollTop < 20) {
          list.scrollTop -= 5
          position.top += list.scrollTop - scrollTop
        } else if (curVal.bottom - scrollTop > offsetHeight - 20) {
          list.scrollTop += 5
          position.top += list.scrollTop - scrollTop
        }
      }
    }
  },
  methods: {
    onClick (e) {
      if (!this.preventClick) {
        this.$emit('real-click', e)
      }
    },
    onTransEnd () {
      if (this.reversing) {
        this.reversing = false

        const { oldIndex, newIndex } = this.getDraggingIndex()
        if (oldIndex !== newIndex) {
          this.$emit('sortend', {
            oldIndex,
            newIndex
          })
        }
        this.newIndex = null
        this.updateValue({})

        this.dragging = false
      }
    },
    updateValue (data) {
      this.$emit('input', data)
    },
    dragHandler () {
      const { top, left } = this.getPosition()
      this.dragging = true
      this.position.top = top
      this.position.left = left
      this.position.offsetX = 0
      this.position.offsetY = 0
      this.scrollHeight = this.$el.offsetParent.scrollHeight
      this.updateValue({
        status: 'start',
        activeInstance: this,
        currentIndex: this.index,
        ...this.getPosition()
      })
    },
    moveHandler ({ offsetX, offsetY }) {
      this.moveLockCount --
      const { dragDirection, position, scrollHeight, value } = this
      const { height } = this.getPosition()

      position.offsetX = (!dragDirection || dragDirection == 'horizontal') ? offsetX : 0
      position.offsetY = (!dragDirection || dragDirection == 'vertical') ? offsetY : 0

      if (position.top + position.offsetY > scrollHeight - height) {
        position.offsetY = scrollHeight - height - position.top + 1
      }
      else if (position.top + position.offsetY < 0) {
        position.offsetY = -position.top
      }

      if (this.moveLockCount < 0) {
        this.updateValue({
          ...value,
          status: 'moving',
          activeInstance: this,
          ...this.getPosition()
        })

        const { oldIndex, newIndex } = this.getDraggingIndex()
        if (this.newIndex !== newIndex) {
          this.newIndex = newIndex
          this.$emit('sort', {
            oldIndex,
            newIndex
          })
        }
      }
    },
    releaseHandler () {
      this.moveLockCount = 5
      this.$emit('input', {
        ...this.value,
        status: 'release',
        activeInstance: this,
        ...this.getPosition()
      })
    },
    startFn (e) {
      const { type } = e || {}
      const isTouch = type === 'touchstart'
      this.preventClick = false

      const { dragData } = this
      const target = e.touches && e.touches[0] || e
      dragData.startX = target.pageX
      dragData.startY = target.pageY
      dragData.pageX = target.pageX
      dragData.pageY = target.pageY

      window.addEventListener(isTouch ? 'touchmove' : 'mousemove', this.moveFn, { passive: false })
      window.addEventListener(isTouch ? 'touchend' : 'mouseup', this.releaseFn)
    },
    moveFn (e) {
      e.preventDefault()
      const target = e.touches && e.touches[0] || e
      const { dragData } = this
      this.preventClick = true

      dragData.pageX = target.pageX
      dragData.pageY = target.pageY

      if (!dragData.moved) {
        this.dragHandler(e)
        dragData.moved = true
      }
      else {
        this.moveHandler({
          offsetX: target.pageX - dragData.startX,
          offsetY: target.pageY - dragData.startY
        })
      }
    },
    releaseFn (e) {
      const { type } = e || {}
      const isTouch = type === 'touchend'

      window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', this.moveFn)
      window.removeEventListener(isTouch ? 'touchend' : 'mouseup', this.releaseFn)
      const { dragData } = this

      if (dragData.moved) {
        this.releaseHandler()
      }
      dragData.moved = false
    },
    getDraggingIndex () {
      const { currentIndex } = this.value
      const oldIndex = this.index
      const newIndex = currentIndex - (currentIndex <= oldIndex ? 0 : 1)

      return { oldIndex, newIndex }
    },
    getPosition () {
      const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = this.$el
      return {
        top: offsetTop,
        right: offsetLeft + offsetWidth,
        bottom: offsetTop + offsetHeight,
        left: offsetLeft,
        height: offsetHeight,
        width: offsetWidth
      }
    },
    judgeOverlap (rectArea1, rectArea2, replaceDirection) {
      const xHalf1 = getHalf(rectArea1.left, rectArea1.right)
      const yHalf1 = getHalf(rectArea1.top, rectArea1.bottom)
      const xHalf2 = getHalf(rectArea2.left, rectArea2.right)
      const yHalf2 = getHalf(rectArea2.top, rectArea2.bottom)

      if (replaceDirection == 'horizontal' && yHalf1 > rectArea2.top && yHalf1 < rectArea2.bottom) {
        if (xHalf1 >= rectArea2.left && xHalf1 <= xHalf2) {
          return 'b'
        }
        else if (xHalf1 > xHalf2 && xHalf1 <= rectArea2.right) {
          return 'a'
        }
      }
      else if (replaceDirection == 'vertical' && xHalf1 > rectArea2.left && xHalf1 < rectArea2.right) {
        if (yHalf1 >= rectArea2.top && yHalf1 <= yHalf2) {
          return 'b'
        }
        else if (yHalf1 > yHalf2 && yHalf1 <= rectArea2.bottom) {
          return 'a'
        }
      }
      return false

      function getHalf(start, end) {
        return start + (end - start) / 2
      }
    }
  }
}
</script>

<style scoped>
.drag-sortable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
.drag-sortable.dragging {
  z-index: 1;
}
.drag-sortable.anim {
  transition: margin 0.2s linear;
}
.drag-sortable.reversing {
  transition: top 0.2s linear, left 0.2s linear;
}
</style>