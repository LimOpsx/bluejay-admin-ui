<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form :inline="true">
          <el-form-item label="菜单名称">
            <el-input
              v-model="queryParams.title"
              placeholder="请输入菜单名称"
              clearable
              size="small"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="菜单状态" clearable size="small">
              <el-option
                v-for="dict in visibleOptions"
                :key="dict.name"
                :label="dict.name"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button
              v-permisaction="['system:sysmenu:add']"
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="handleAdd"
            >新增</el-button>
          </el-form-item>
        </el-form>

        <el-table
          v-loading="loading"
          :data="menuList"
          row-key="id"
          :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
        >
          <el-table-column prop="title" label="菜单名称" :show-overflow-tooltip="true" width="180px" />
          <el-table-column prop="icon" label="图标" align="center" width="100px">
            <template slot-scope="scope">
              <svg-icon :icon-class="scope.row.icon" />
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="60px" />
          <el-table-column prop="permission" label="权限标识" :show-overflow-tooltip="true" />
          <el-table-column prop="path" label="路径" :show-overflow-tooltip="true">
            <template slot-scope="scope">
              <span v-if="scope.row.type=='4'">{{ scope.row.path }}</span>
              <span v-else>{{ scope.row.component }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="可见" :formatter="visibleFormat" width="80">
            <template slot-scope="scope">
              <el-tag
                :type="scope.row.status === 1 ? 'danger' : 'success'"
                disable-transitions
              >{{ visibleFormat(scope.row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
            <template slot-scope="scope">
              <el-button
                v-permisaction="['system:sysmenu:edit']"
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
              >修改</el-button>
              <el-button
                v-permisaction="['system:sysmenu:add']"
                size="mini"
                type="text"
                icon="el-icon-plus"
                @click="handleAdd(scope.row)"
              >新增</el-button>
              <el-button
                v-permisaction="['system:sysmenu:remove']"
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleDelete(scope.row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 添加或修改菜单对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="600px">
          <el-form ref="form" :model="form" :rules="rules" label-width="80px">
            <el-row>
              <el-col :span="24">
                <el-form-item label="上级菜单">
                  <treeselect
                    v-model="form.parentId"
                    :options="menuOptions"
                    :normalizer="normalizer"
                    :show-count="true"
                    placeholder="选择上级菜单"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="菜单标题" prop="title">
                  <el-input v-model="form.title" placeholder="请输入菜单标题" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="显示排序" prop="sort">
                  <el-input-number v-model="form.sort" controls-position="right" :min="0" />
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="菜单类型" prop="type">
                  <el-radio-group v-model="form.type">
                    <el-radio :label="1">目录</el-radio>
                    <el-radio :label="2">菜单</el-radio>
                    <el-radio :label="3">按钮</el-radio>
                    <el-radio :label="4">接口</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item v-if="form.type == '4'" label="请求方式">
                  <el-radio-group v-model="form.action">
                    <el-radio label="GET">GET</el-radio>
                    <el-radio label="POST">POST</el-radio>
                    <el-radio label="PUT">PUT</el-radio>
                    <el-radio label="DELETE">DELETE</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="菜单图标">
                  <el-popover
                    placement="bottom-start"
                    width="460"
                    trigger="click"
                    @show="$refs['iconSelect'].reset()"
                  >
                    <IconSelect ref="iconSelect" @selected="selected" />
                    <el-input slot="reference" v-model="form.icon" placeholder="点击选择图标" readonly>
                      <svg-icon
                        v-if="form.icon"
                        slot="prefix"
                        :icon-class="form.icon"
                        class="el-input__icon"
                        style="height: 32px;width: 16px;"
                      />
                      <i v-else slot="prefix" class="el-icon-search el-input__icon" />
                    </el-input>
                  </el-popover>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item v-if="form.type == '1' || form.type == '2'" label="路由名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入路由名称" />
                </el-form-item>
              </el-col>

              <el-col v-if="form.type == '1' || form.type == '2'" :span="12">
                <el-form-item label="组件路径" prop="component">
                  <el-input v-model="form.component" placeholder="请输入组件路径" />
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item v-if="form.type == '1' || form.type == '2'" label="是否外链">
                  <el-radio-group v-model="form.isFrame">
                    <el-radio :label="0">是</el-radio>
                    <el-radio :label="1">否</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item v-if="form.type != '3'" label="路由地址" prop="path">
                  <el-input v-model="form.path" placeholder="请输入路由地址" />
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item v-if="form.type == '2' || form.type == '3'" label="权限标识">
                  <el-input v-model="form.permission" placeholder="请权限标识" maxlength="50" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item v-if="form.type != '3'" label="菜单状态">
                  <el-radio-group v-model="form.status">
                    <el-radio
                      v-for="dict in visibleOptions"
                      :key="dict.name"
                      :label="dict.value"
                      :value="dict.value"
                    >{{ dict.name }}</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </el-dialog>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { listMenu, getMenu, delMenu, addMenu, updateMenu } from '@/api/system/menu'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import IconSelect from '@/components/IconSelect'

export default {
  name: 'Menu',
  components: { Treeselect, IconSelect },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 菜单表格树数据
      menuList: [],
      // 菜单树选项
      menuOptions: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 菜单状态数据字典
      visibleOptions: [],
      // 查询参数
      queryParams: {
        title: undefined,
        status: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        title: [
          { required: true, message: '菜单标题不能为空', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '菜单顺序不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getDicts('sys_status').then(response => {
      this.visibleOptions = response.data
    })
  },
  methods: {
    // 选择图标
    selected(name) {
      this.form.icon = name
    },
    /** 查询菜单列表 */
    getList() {
      this.loading = true
      listMenu(this.queryParams).then(response => {
        this.menuList = response.data
        this.loading = false
      })
    },
    /** 转换菜单数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children
      }
      return {
        id: node.id,
        label: node.title,
        children: node.children
      }
    },
    /** 查询菜单下拉树结构 */
    getTreeSelect() {
      listMenu().then(response => {
        this.menuOptions = []
        const menu = { id: 0, title: '主类目', children: [] }
        menu.children = response.data
        this.menuOptions.push(menu)
      })
    },
    // 菜单显示状态字典翻译
    visibleFormat(row) {
      if (row.type === 3) {
        return '-- --'
      }
      return this.selectDictLabel(this.visibleOptions, row.status)
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        id: undefined,
        parentId: 0,
        name: undefined,
        icon: undefined,
        type: '1',
        sort: 0,
        action: this.form.type === '4' ? this.form.action : '',
        isFrame: '1',
        status: '0'
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.getList()
    },
    /** 新增按钮操作 */
    handleAdd(row) {
      this.reset()
      this.getTreeSelect()
      if (row != null) {
        this.form.parentId = row.id
      }
      this.open = true
      this.title = '添加菜单'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      this.getTreeSelect()
      getMenu(row.id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改菜单'
      })
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateMenu(this.form, this.form.id).then(response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addMenu(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('新增成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.message)
              }
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      this.$confirm('是否确认删除名称为"' + row.title + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delMenu(row.id)
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      }).catch(function() {})
    }
  }
}
</script>
