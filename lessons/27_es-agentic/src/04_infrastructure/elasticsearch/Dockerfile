# 外部前置条件：构建时需要 Docker 和网络；ES 与 IK 插件版本必须一致。
FROM elasticsearch:8.17.0

RUN elasticsearch-plugin install --batch \
    https://release.infinilabs.com/analysis-ik/stable/elasticsearch-analysis-ik-8.17.0.zip
