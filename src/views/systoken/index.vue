<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              v-permisaction="['system:sysadmintoken:disable']"
              type="warning"
              icon="el-icon-warning"
              size="mini"
              :disabled="multiple"
              @click="handleDisable"
            >封禁
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['system:sysadmintoken:down']"
              type="danger"
              icon="el-icon-error"
              size="mini"
              :disabled="multiple"
              @click="handleDisable"
            >下线
            </el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loading" :data="typeList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center"/>
          <el-table-column label="序号" width="80" align="center" prop="id"/>
          <el-table-column label="令牌来源" align="center" prop="target" :show-overflow-tooltip="true"/>
          <el-table-column label="令牌内容" align="center" prop="value" :show-overflow-tooltip="true"/>
          <el-table-column label="到期时间" align="center" prop="expires" width="180">
            <template slot-scope="scope">
              <span>{{ parsePlsTime(scope.row.expires) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="禁用到期时间" align="center" prop="disableEndDate" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.disableEndDate) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" prop="expStatus" :formatter="statusFormat"/>
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                v-permisaction="['system:sysadmintoken:renewal']"
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleRenewal(scope.row)"
              >续期
              </el-button>
              <el-button v-if="scope.row.expStatus == 0"
                         v-permisaction="['system:sysadmintoken:disable']"
                         size="mini"
                         type="text"
                         icon="el-icon-warning"
                         @click="handleDisable(scope.row)"
              >封禁
              </el-button>
              <el-button v-if="scope.row.expStatus == 0"
                         v-permisaction="['system:sysadmintoken:down']"
                         size="mini"
                         type="text"
                         icon="el-icon-error"
                         @click="handleDisable(scope.row)"
              >下线
              </el-button>
              <el-button v-if="scope.row.expStatus == 3"
                         v-permisaction="['system:sysadmintoken:up']"
                         size="mini"
                         type="text"
                         icon="el-icon-delete"
                         @click="handleDisable(scope.row)"
              >上线
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.current"
          :limit.sync="queryParams.size"
          @pagination="getList"
        />
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import {page} from '@/api/system/systoken'
import {listType, getType, delType, addType, updateType} from '@/api/system/dict/type'

export default {
  name: 'adminSysToken',
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 字典表格数据
      typeList: [],
      // 弹出层标题
      title: '',
      isEdit: false,
      // 是否显示弹出层
      open: false,
      // 状态数据字典
      statusOptions: [],
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        page: {
          current: 1,
          size: 10,
        },
        disableEndDate: undefined,
        expires: undefined,
        target: undefined,
        value: undefined,
        expStatus: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        target: [
          {required: true, message: '来源名称不能为空', trigger: 'blur'}
        ],
        type: [
          {required: true, message: '字典类型不能为空', trigger: 'blur'}
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getDicts('exp_status').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    /** 查询字典类型列表 */
    getList() {
      this.loading = true
      page(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.typeList = response.data.records
        this.total = response.data.total
        this.loading = false
      })
    },
    // 字典状态字典翻译
    statusFormat(row, column) {
      return this.selectDictLabel(this.statusOptions, parseInt(row.status))
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
        target: undefined,
        type: undefined,
        status: 0,
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.current = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加字典类型'
      this.isEdit = false
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const dictId = row.id || this.ids
      getType(dictId).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改字典类型'
        this.isEdit = true
      })
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateType(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addType(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('新增成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          }
        }
      })
    },
    /** 禁用按钮操作 */
    handleDisable(row) {
      const dictIds = (row.id && [row.id]) || this.ids
      this.$confirm('是否确认删除字典编号为"' + dictIds + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        return delType(dictIds)
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      }).catch(function () {
      })
    },
    /**
     * 续期操作
     * @param row 行
     */
    handleRenewal(row) {

    },

    parseTime(time, cFormat) {
      if (!time) {
        return ""
      }
      const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
      let date
      if (typeof time === 'object') {
        date = time
      } else {
        if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
          time = parseInt(time)
        }
        if ((typeof time === 'number') && (time.toString().length === 10)) {
          time = time * 1000
        }
        date = new Date(time)
      }
      const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
      }
      const time_str = format.replace(/{([ymdhisa])+}/g, (result, key) => {
        const value = formatObj[key]
        // Note: getDay() returns 0 on Sunday
        if (key === 'a') {
          return ['日', '一', '二', '三', '四', '五', '六'][value]
        }
        return value.toString().padStart(2, '0')
      })
      return time_str
    },
    parsePlsTime(expires) {
      let now = new Date();
      return this.parseTime(new Date(now.setSeconds(now.getSeconds() + expires / 1000)));
    }
  }
}
</script>
