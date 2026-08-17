# 外部前置条件：构建时需要 Docker 和网络，用于下载与 ES 严格同版本的 IK 插件。
FROM elasticsearch:8.17.0

# IK 负责中文词语级切分；索引与查询阶段的具体 analyzer 在索引 mapping 中配置。
RUN elasticsearch-plugin install --batch \
    https://release.infinilabs.com/analysis-ik/stable/elasticsearch-analysis-ik-8.17.0.zip
