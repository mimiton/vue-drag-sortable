<template>
  <div class="app">
    <div class="pannel">
      <h1>Free drag & Vertical replace(Default mode)</h1>
      <div class="list">
        <sortable class="item" v-for="(item, index) in listData" v-model="dragData1" :key="item" :index="index" @sortend="sortend($event, listData)">
          Item {{ item }}
        </sortable>
      </div>
    </div>
    <div class="pannel">
      <h1>Vertical drag & Vertical replace</h1>
      <div class="list">
        <sortable class="item" v-for="(item, index) in listData" v-model="dragData2" @click.native="alert" :key="item" :index="index" @sortend="sortend($event, listData)" drag-direction="vertical">
          Item {{ item }}
        </sortable>
      </div>
    </div>
    <div class="pannel">
      <h1>Free drag & Horizontal replace</h1>
      <div class="list grid">
        <sortable class="item" v-for="(item, index) in listData" v-model="dragData3" :key="item" :index="index" @sortend="sortend($event, listData)" replace-direction="horizontal">
          Item {{ item }}
        </sortable>
      </div>
    </div>
    <div class="pannel">
      <h1>Horizontal drag & Horizontal replace</h1>
      <div class="list row">
        <sortable class="item" v-for="(item, index) in listData" v-model="dragData4" :key="item" :index="index" @sortend="sortend($event, listData)" drag-direction="horizontal" replace-direction="horizontal">
          Item {{ item }}
        </sortable>
      </div>
    </div>
  </div>
</template>

<script>
import Sortable from './DragSortable.vue';

export default {
  name: 'App',
  components: {
    Sortable
  },
  data () {
    return {
      dragData1: {},
      dragData2: {},
      dragData3: {},
      dragData4: {},
      listData: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    }
  },
  methods: {
    alert (a) {
      console.log(a)
    },
    sortend (e, list) {
      const { oldIndex, newIndex } = e;
      this.rearrange(list, oldIndex, newIndex);
    },
    rearrange (array, oldIndex, newIndex) {
      if (oldIndex > newIndex) {
        array.splice(newIndex, 0, array[oldIndex]);
        array.splice(oldIndex + 1, 1);
      }
      else {
        array.splice(newIndex + 1, 0, array[oldIndex]);
        array.splice(oldIndex, 1);
      }
    }
  }
}
</script>

<style>
body {
  margin: 0;
}
.app {
  padding: 0 0 300px;
}
.pannel {
  display: inline-block;
  vertical-align: top;
  border: 1px solid #f0f0f0;
}
.pannel > h1 {
  margin: 0;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.list {
  position: relative;
  width: 300px;
  height: 400px;
  overflow: auto;
}
.list > .item {
  width: 100%;
  box-sizing: border-box;
}

.list > .item.dragging {
  box-shadow: 0 2px 10px 0 rgba(0,0,0,0.2);
  background: white!important;
  border-color: white;
}
.list > .item.active {
  background: #eeeeee;
}
.list > .item:hover {
  background: #f5f5f5;
}
.list > .item:before {
  content: '';
  display: block;
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 0;
  border-bottom: 1px solid #f0f0f0;
}
.list > .item {
  position: relative;
  cursor: pointer;
  padding: 16px 35px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.list.grid {
  width: 600px;
}
.list.grid > .item {
  display: inline-block;
  width: 100px;
  box-sizing: border-box;
  border: 1px solid #f0f0f0;
}
.list.row {
  width: 1200px;
  height: auto;
  white-space: nowrap;
}
.list.row > .item {
  display: inline-block;
  width: 140px;
  text-align: center;
  border: 1px solid #f0f0f0;
}
</style>
