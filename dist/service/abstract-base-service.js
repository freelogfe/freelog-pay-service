"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const lodash_1 = require("lodash");
class BaseService {
    /**
     * SQL语句构建器
     */
    get queryBuild() {
        return this.repository.createQueryBuilder(this.tableAlias);
    }
    count(options) {
        return this.repository.count(options);
    }
    find(options) {
        return this.repository.find(options);
    }
    findAndCount(options) {
        return this.repository.findAndCount(options);
    }
    findByIds(ids, options) {
        return this.repository.findByIds(ids, options);
    }
    findOne(id, options) {
        return this.repository.findOne(id, options);
    }
    findPageList(conditions) {
        conditions.skip = conditions.skip ?? 0;
        conditions.take = conditions.take ?? 10;
        return this.findAndCount(conditions).then(([dataList, totalItem]) => {
            return { skip: conditions.skip, limit: conditions.take, totalItem, dataList };
        });
    }
    insert(entity) {
        return this.repository.insert(entity).then(t => Boolean(t.identifiers.length));
    }
    query(query, parameters) {
        return this.repository.query(query, parameters);
    }
    update(criteria, partialEntity) {
        if (!partialEntity || !Object.keys(partialEntity).length) {
            return Promise.resolve(false);
        }
        return this.repository.update(criteria, partialEntity).then(t => Boolean(t.affected));
    }
    delete(criteria) {
        return this.repository.delete(criteria).then(t => Boolean(t.affected));
    }
    buildSelectFields(select, IgnoreFields) {
        if (lodash_1.isString(select) && !IgnoreFields?.includes(select)) {
            return `${this.tableAlias}.${select}`;
        }
        else if (lodash_1.isArray(select)) {
            return select.filter(m => !IgnoreFields?.includes(m)).map(x => `${this.tableAlias}.${x}`);
        }
        return select;
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3QtYmFzZS1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IkQ6L+W3peS9nC9mcmVlbG9nLXBheS1zZXJ2aWNlL3NyYy8iLCJzb3VyY2VzIjpbInNlcnZpY2UvYWJzdHJhY3QtYmFzZS1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1DQUF5QztBQVF6QyxNQUFhLFdBQVc7SUFLcEI7O09BRUc7SUFDSCxJQUFJLFVBQVU7UUFDVixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFJRCxLQUFLLENBQUMsT0FBMEQ7UUFDNUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBSUQsSUFBSSxDQUFDLE9BQTBEO1FBQzNELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUlELFlBQVksQ0FBQyxPQUEwRDtRQUNuRSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFJRCxTQUFTLENBQUMsR0FBVSxFQUFFLE9BQTBEO1FBQzVFLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFLRCxPQUFPLENBQUMsRUFBNkUsRUFBRSxPQUFnQztRQUNuSCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsWUFBWSxDQUFDLFVBQW1DO1FBQzVDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7UUFDdkMsVUFBVSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUN4QyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRTtZQUNoRSxPQUFPLEVBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBQyxDQUFDO1FBQ2hGLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUF5RTtRQUM1RSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFhLEVBQUUsVUFBa0I7UUFDbkMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUF3RixFQUFFLGFBQTZDO1FBQzFJLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUN0RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDakM7UUFDRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUF3RjtRQUMzRixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBU0QsaUJBQWlCLENBQUMsTUFBVyxFQUFFLFlBQXVCO1FBQ2xELElBQUksaUJBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDckQsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLElBQUksTUFBTSxFQUFFLENBQUM7U0FDekM7YUFBTSxJQUFJLGdCQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDeEIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDN0Y7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBQ0o7QUFyRkQsa0NBcUZDIn0=