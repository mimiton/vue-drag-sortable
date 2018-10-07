<template>
  <div class="drag-sortable"
    :class="{ dragging: dragging, 'reversing': reversing }"
    :style="rootStyle"
    @mousedown="onMouseDown"
  >
  <slot/>
  </div>
</template>

<script>
let overlappingVue;
export default {
  name: 'DragSortable',
  props: ['value', 'index', 'dragDirection', 'replaceDirection'],
  data () {
    return {
      frozen: false,
      start: false,
      dragging: false,
      overlapping: false,
      reversing: false,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      offsetX: 0,
      offsetY: 0,
      hoveredMargin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      inputTimer: 0,
      clickTimer: 0
    };
  },
  computed: {
    rootStyle ()  {
      const {
        dragging, dragDirection, startTop, startLeft,
        offsetY, offsetX, hoveredMargin
      } = this;
      const { top, right, bottom, left } = hoveredMargin || {};

      return {
        'position': dragging ? 'absolute': '',
        'z-index': dragging ? 1 : '',
        'top': dragging && (dragDirection !== 'horizontal') ? ((startTop + offsetY) + 'px') : '',
        'left': dragging && (dragDirection !== 'vertical') ? ((startLeft + offsetX) + 'px') : '',
        'margin-top': top ? (top + 'px') : '',
        'margin-right': right ? (right + 'px') : '',
        'margin-bottom': bottom ? (bottom + 'px') : '',
        'margin-left': left ? (left + 'px') : ''
      }
    }
  },
  watch: {
    overlapping (curVal, oldVal) {
      if (curVal && oldVal != curVal) {
        if (overlappingVue) {
          // freeze the last overlapping item when changing to next overlapping item
          // so it will be ignored when judging if overlapping
          overlappingVue.freeze();
          overlappingVue.overlapping = false;
          overlappingVue.updateOverlap();
        }
        overlappingVue = this;
        this.updateOverlap();
      }
    },
    value (curVal) {
      const root = this.$el;
      this.reversing = false;

      const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = root;
      const { _start, _end, self, top, right, bottom, left, oldIndex } = curVal;

      if (_end) {
        const _this = this;
        _this.reversing = true;

        if (_this.overlapping) {
          self.offsetY = offsetTop - ((!this.replaceDirection || this.replaceDirection === 'vertical') ? (bottom - top) : 0) - self.startTop;
          self.offsetX = offsetLeft - (this.replaceDirection === 'horizontal' ? (right - left) : 0) - self.startLeft;

          setTimeout(function () {
            self.dragging = false;
            _this.hoveredMargin = null;
            _this.overlapping = false;
            overlappingVue = null;
            const oldIndex = curVal.oldIndex;
            const newIndex = _this.index - (_this.index < oldIndex ? 0 : 1);
            if (oldIndex !== newIndex) {
              _this.$emit('sortend', {
                oldIndex,
                newIndex
              });
            }
          }, 200);
        }

        return;
      }

      if (self === this) {
        self.$nextTick(function () {
          self.dragging = true;
        });
        const list = root.parentNode;
        list.style.overflow = 'hidden';
        const { scrollTop } = list;
        const listHeight = list.offsetHeight;
        if (top - scrollTop < 20) {
          list.scrollTop -= 10;
          self.startTop += list.scrollTop - scrollTop;
        }
        else if (bottom - scrollTop > listHeight - 20) {
          list.scrollTop += 10;
          self.startTop += list.scrollTop - scrollTop;
        }
        return
      }

      if (_start) {
        const isNext = this.index === oldIndex + 1;
        if (isNext) {
          this.reversing = true;
          this.overlapping = true;
        }
        return;
      }

      const boundLeft = offsetLeft;
      const boundTop = offsetTop;
      const boundRight = boundLeft + offsetWidth;
      const boundBottom = boundTop + offsetHeight;




      if (!this.frozen) {
        const overlapping = this.judgeOverlap(curVal, {
          top: boundTop,
          right: boundRight,
          bottom: boundBottom,
          left: boundLeft
        }, 0);

        if (overlapping) {
          this.overlapping = overlapping;
        }
      }
    }
  },
  methods: {
    freeze (time) {
      const self = this;
      self.frozen = true;
      setTimeout(function () {
        self.frozen = false;
      }, time || 300);
    },
    updateOverlap () {
      const { top, right, bottom, left } = this.value;
      const height = bottom - top;
      const width = right - left;

      const { overlapping } = this;
      const obj = {};
      if (overlapping) {
        if (!this.replaceDirection || this.replaceDirection === 'vertical') {
          obj.top = height;
        }
        else if (this.replaceDirection === 'horizontal') {
          obj.left = width;
        }
      }
      this.hoveredMargin = obj;

      this.$emit('sort', {
        newIndex: this.index,
        oldIndex: this.value.oldIndex
      });
    },
    judgeOverlap (rectArea_1, rectArea_2, threshold) {
      let { top, right, left, bottom } = rectArea_1;

      if (threshold < 1) {
        const vertical = (bottom - top) * parseFloat(threshold);
        const horizontal = (right - left) * parseFloat(threshold);
        top += vertical;
        right -= horizontal;
        bottom -= vertical;
        left += horizontal;
      }
      else if (threshold) {
        top += parseInt(threshold);
        right -= parseInt(threshold);
        bottom -= parseInt(threshold);
        left += parseInt(threshold);
      }

      const point_1 = { x: left, y: top };
      const point_2 = { x: right, y: top };
      const point_3 = { x: left, y: bottom };
      const point_4 = { x: right, y: bottom };

      return pointInArea(point_1, rectArea_2) ||
          pointInArea(point_2, rectArea_2) ||
          pointInArea(point_3, rectArea_2) ||
          pointInArea(point_4, rectArea_2);

      function pointInArea(point, area) {
        const { x, y } = point;
        const { top, right, bottom, left } = area;

        return x > left && x < right && y > top && y < bottom;
      }
    },
    onMouseDown (e) {
      const self = this;
      const root = self.$el;
      const { currentTarget } = e;
      const scrollHeight = root.parentNode.scrollHeight;
      self.start = true;
      self.startX = e.pageX;
      self.startY = e.pageY;
      self.startLeft = currentTarget.offsetLeft;
      self.startTop = currentTarget.offsetTop;
      self.offsetX = 0;
      self.offsetY = 0;


      self.clickTimer = setTimeout(function () {
        self.$el.__preventClick = 1;
      }, 200);

      function getMouseEventParams(e) {
        const { pageX, pageY } = e;
        const { startX, startY } = self;
        const offsetX = pageX - startX;
        const offsetY = pageY - startY;
        const root = self.$el;
        const { offsetWidth, offsetHeight } = root;
        const left = self.startLeft + self.offsetX;
        const top = self.startTop + self.offsetY;
        const right = left + offsetWidth;
        const bottom = top + offsetHeight;

        return { offsetX, offsetY, top, right, bottom, left };
      }
      const onMouseMove = function(e) {
        let { offsetX, offsetY, top, right, left, bottom } = getMouseEventParams(e);

        const h = bottom - top;

        if (self.startTop + offsetY >= scrollHeight - h) {
          bottom = scrollHeight;
          top = bottom - h;
          offsetY = scrollHeight - h - self.startTop;
        }
        else if (self.startTop + offsetY <= 0) {
          bottom = h;
          top = 0;
          offsetY = -self.startTop;
        }

        self.offsetX = offsetX;
        self.offsetY = offsetY;

        clearTimeout(self.inputTimer);
        self.inputTimer = setTimeout(function () {
          self.$emit('input', {
            _start: self.start,
            self,
            top, right, bottom, left,
            oldIndex: self.index
          });
          if (self.start) {
            self.start = false;
          }
        }, 15);
      };
      const mouseupHandler = function (e) {
        clearTimeout(self.inputTimer);
        clearTimeout(self.clickTimer);

        const { top, right, left, bottom } = getMouseEventParams(e);

        self.offsetY = 0;
        self.offsetX = 0;
        root.parentNode.style.overflow = '';

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', mouseupHandler);
        self.$emit('input', {
          _end: true,
          self,
          top, right, bottom, left,
          oldIndex: self.index
        });
      };


      onMouseMove(e);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', mouseupHandler);
    }
  }
}
</script>

<style scoped>
.drag-sortable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  transition: margin 0.2s linear;
}
.drag-sortable.reversing {
  transition: top 0.2s linear, left 0.2s linear;
}
</style>