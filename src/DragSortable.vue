<template>
  <div class="drag-sortable"
    :class="{ dragging, reversing, anim: value.status == 'moving' }"
    :style="[marginStyle, rootStyle]"
    @mousedown="startFn" @touchstart="startFn"
    @transitionend="onTransEnd"
  >
    <slot/>
  </div>
</template>

<script>
let overlappingVue
let lastIndex = 0
export default {
  props: ['value', 'index', 'dragDirection', 'replaceDirection'],
  data () {
    return {
      moveLockCount: 5,
      scrollHeight: 0,
      overlapping: false,
      reversing: false,
      dragging: false,
      lockAnim: false,
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
        pageY: 0,
        offsetX: 0,
        offsetY: 0
      }
    }
  },
  computed: {
    marginStyle () {
      const { dragging, replaceDirection, value, index } = this
      const { currentIndex } = value
      const verticalMarginStyle = {
        marginTop: (index == 0 && index == currentIndex) ? (value.height + 'px') : null,
        marginBottom: (index == currentIndex - 1) ? (value.height + 'px') : null
      }
      const horizontalMarginStyle = {
        marginLeft: (index == 0 && index == currentIndex) ? (value.width + 'px') : null,
        marginRight: (index == currentIndex - 1) ? (value.width + 'px') : null
      }
      return !dragging ? replaceDirection === 'horizontal' ? horizontalMarginStyle : verticalMarginStyle : null
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
      const { replaceDirection } = this
      const { activeInstance, currentIndex, status } = curVal

      if (status == 'moving' && this !== activeInstance) {
        const position = this.getPosition()
        const overlapping = this.judgeOverlap(curVal, position, replaceDirection == 'horizontal' ? 'x' : 'y')
        if (overlapping) {
          let newIndex = overlapping == 'a' ? (this.index + 1) : this.index
          if (newIndex == activeInstance.index + 1) {
            newIndex --
          }
          if (currentIndex != newIndex) {
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
        if (currentIndex == this.index + 1) {
          const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = this.$el
          const revertY = ((!replaceDirection || replaceDirection === 'vertical')) ? offsetHeight : 0
          const revertX = (replaceDirection === 'horizontal') ? offsetWidth : 0

          position.offsetY = offsetTop + revertY - activeInstance.position.top
          position.offsetX = offsetLeft + revertX - activeInstance.position.left
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
    onTransEnd () {
      if (this.reversing) {
        this.reversing = false

        const { currentIndex } = this.value
        const oldIndex = this.index
        const newIndex = currentIndex - (currentIndex <= oldIndex ? 0 : 1)
        console.log(oldIndex, newIndex)
        if (oldIndex !== newIndex) {
          this.$emit('sortend', {
            oldIndex,
            newIndex
          })
        }
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
      const { dragDirection } = this
      const position = this.getPosition()
      this.position.offsetX = (!dragDirection || dragDirection == 'horizontal') ? offsetX : 0
      this.position.offsetY = (!dragDirection || dragDirection == 'vertical') ? offsetY : 0

      if (this.position.top + this.position.offsetY > this.scrollHeight - position.height) {
        this.position.offsetY = this.scrollHeight - position.height - this.position.top + 1
      }
      else if (this.position.top + this.position.offsetY < 0) {
        this.position.offsetY = - this.position.top
      }

      if (this.moveLockCount < 0) {
        this.updateValue({
          ...this.value,
          status: 'moving',
          activeInstance: this,
          ...this.getPosition()
        })
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

      let disabled = this.dragHandler(e)

      if (!disabled) {
        e.preventDefault()
        const { dragData } = this
        const target = e.touches && e.touches[0] || e
        dragData.startX = target.pageX
        dragData.startY = target.pageY
        dragData.pageX = target.pageX
        dragData.pageY = target.pageY
        window.addEventListener(isTouch ? 'touchmove' : 'mousemove', this.moveFn)
        window.addEventListener(isTouch ? 'touchend' : 'mouseup', this.releaseFn)
      }
    },
    moveFn (e) {
      const target = e.touches && e.touches[0] || e
      const { dragData } = this

      dragData.pageX = target.pageX
      dragData.pageY = target.pageY
      this.moveHandler({
        offsetX: target.pageX - dragData.startX,
        offsetY: target.pageY - dragData.startY
      })
    },
    releaseFn (e) {
      const { type } = e || {}
      const isTouch = type === 'touchend'

      window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', this.moveFn)
      window.removeEventListener(isTouch ? 'touchend' : 'mouseup', this.releaseFn)
      const target = e.touches && e.touches[0] || e
      const { dragData } = this

      const pageX = target.pageX || dragData.pageX
      const pageY = target.pageY || dragData.pageY
      this.releaseHandler({
        offsetX: pageX - dragData.startX,
        offsetY: pageY - dragData.startY
      })
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
    judgeOverlap (rectArea1, rectArea2, direction) {
      const xHalf1 = getHalf(rectArea1.left, rectArea1.right)
      const yHalf1 = getHalf(rectArea1.top, rectArea1.bottom)
      const xHalf2 = getHalf(rectArea2.left, rectArea2.right)
      const yHalf2 = getHalf(rectArea2.top, rectArea2.bottom)

      if (direction == 'x') {
        if (xHalf1 >= rectArea2.left && xHalf1 <= xHalf2) {
          return 'b'
        }
        else if (xHalf1 > xHalf2 && xHalf1 <= rectArea2.right) {
          return 'a'
        }
      }
      else {
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
.drag-sortable.anim {
  transition: margin 0.2s linear;
}
.drag-sortable.reversing {
  transition: top 0.2s linear, left 0.2s linear;
}
</style>