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
      bound: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
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
      const self = this;
      const root = self.$el;
      self.reversing = false;

      const { replaceDirection } = self;
      const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = root;
      const { _start, _end, draggingItem, top, right, bottom, left, oldIndex } = curVal;

      if (_end) {
        self.reversing = true;

        const isLastItem = !overlappingVue && self === draggingItem;
        if (self.overlapping || isLastItem) {
          const revertY = (!isLastItem && (!replaceDirection || replaceDirection === 'vertical')) ? (bottom - top) : 0;
          const revertX = (!isLastItem && replaceDirection === 'horizontal') ? (right - left) : 0;
          draggingItem.offsetY = offsetTop - revertY - draggingItem.startTop;
          draggingItem.offsetX = offsetLeft - revertX - draggingItem.startLeft;

          setTimeout(function () {
            draggingItem.dragging = false;
            self.hoveredMargin = null;
            self.overlapping = false;
            overlappingVue = null;
            const oldIndex = curVal.oldIndex;
            const newIndex = self.index - (self.index <= oldIndex ? 0 : 1);
            if (oldIndex !== newIndex) {
              self.$emit('sortend', {
                oldIndex,
                newIndex
              });
            }
          }, 200);
        }

        return;
      }

      if (draggingItem === self) {
        draggingItem.$nextTick(function () {
          draggingItem.dragging = true;
        });
        const list = root.parentNode;
        list.style.overflow = 'hidden';
        const { scrollTop } = list;
        const listHeight = list.offsetHeight;
        if (top - scrollTop < 20) {
          list.scrollTop -= 10;
          draggingItem.startTop += list.scrollTop - scrollTop;
        }
        else if (bottom - scrollTop > listHeight - 20) {
          list.scrollTop += 10;
          draggingItem.startTop += list.scrollTop - scrollTop;
        }
        return
      }

      if (_start) {
        const isNext = self.index === oldIndex + 1;
        if (isNext) {
          self.reversing = true;
          self.overlapping = true;
        }
        return;
      }

      const boundLeft = offsetLeft;
      const boundTop = offsetTop;
      const boundRight = boundLeft + offsetWidth;
      const boundBottom = boundTop + offsetHeight;

      self.bound.top = boundTop;
      self.bound.right = boundRight;
      self.bound.bottom = boundBottom;
      self.bound.left = boundLeft;



      if (!self.frozen) {
        const overlapping = self.judgeOverlap(curVal, {
          top: boundTop,
          right: boundRight,
          bottom: boundBottom,
          left: boundLeft
        });

        if (overlapping) {
          self.overlapping = overlapping;
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
    judgeOverlap (rectArea_1, rectArea_2) {
      return calcArea(rectArea_1, rectArea_2) > 0;

      function calcArea(rect1, rect2) {
        const t1 = rect1.top, r1 = rect1.right, b1 = rect1.bottom, l1 = rect1.left;
        const t2 = rect2.top, r2 = rect2.right, b2 = rect2.bottom, l2 = rect2.left;
        const top = max(t1, t2);
        const right = min(r1,r2);
        const bottom = min(b1, b2);
        const left = max(l1, l2);
        const width = right - left;
        const height = bottom - top;
        if (width <= 0 || height <= 0) {
          return 0;
        }
        else {
          return width * height;
        }

        function min(arg1, arg2) {
          return arg1 < arg2 ? arg1 : arg2;
        }
        function max(arg1, arg2) {
          return arg1 > arg2 ? arg1 : arg2;
        }
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
            draggingItem: self,
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
          draggingItem: self,
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