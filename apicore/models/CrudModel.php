<?php

require_once __DIR__ . '/BaseModel.php';

class CrudModel extends BaseModel {
    
    public function select(array $input): array {
        $table    = clean($input['table'] ?? '');
        $columns  = $input['columns'] ?? ['*'];
        $where    = $input['where'] ?? [];
        $page     = (int)($input['page'] ?? 0);
        $size     = (int)($input['size'] ?? 10);
        $search   = $input['search'] ?? null;
        $searchBy = clean($input['searchBy'] ?? 'name');
        $groupBy  = $input['groupBy'] ?? null;
        $orderBy  = $input['orderBy'] ?? null;
        $includes = $input['include'] ?? [];
        
        $params = [];
        $columnsSql = implode(',', $columns);
        $sql = "SELECT {$columnsSql} FROM {$table}";

        // Handle Includes (Subqueries)
        if (is_array($includes) && count($includes)) {
            $subqueries = [];
            foreach ($includes as $inc) {
                $incTable = clean($inc['table'] ?? '');
                $alias    = clean($inc['alias'] ?? $incTable);
                $fk       = clean($inc['foreign_key'] ?? '');
                $ref      = clean($inc['reference_key'] ?? '');
                $cols     = $inc['columns'] ?? [];
                
                if (!$incTable || !$fk || !$ref || !is_array($cols)) continue;

                $pairs = array_map(fn($c) => "'{$c}', ia.`{$c}`", $cols);
                $json = "JSON_OBJECT(" . implode(',', $pairs) . ")";
                
                $subWhereSql = "";
                if (isset($inc['where']) && is_array($inc['where'])) {
                    foreach ($inc['where'] as $wk => $wv) {
                        $wCol = clean($wk);
                        $phName = ":" . $alias . "_" . str_replace(['.', '-'], '_', $wCol);
                        if ($wv === null || $wv === 'null') {
                            $subWhereSql .= " AND ia.`{$wCol}` IS NULL";
                        } else {
                            $subWhereSql .= " AND ia.`{$wCol}` = {$phName}";
                            $params[$phName] = $wv;
                        }
                    }
                }

                $subqueries[] = "(SELECT JSON_ARRAYAGG({$json}) FROM {$incTable} ia WHERE ia.`{$fk}` = {$table}.`{$ref}` {$subWhereSql}) AS {$alias}";
            }
            if ($subqueries) {
                $sql = str_replace("SELECT {$columnsSql}", "SELECT {$columnsSql}, " . implode(',', $subqueries), $sql);
            }
        }

        // Handle Filters
        $whereParts = [];
        foreach ($where as $k => $v) {
            $rawKey = $k; 
            if (strpos($rawKey, 'raw:') === 0) {
                $whereParts[] = "({$v})";
                continue;
            }
            
            $key = clean($rawKey);
            if ($v === null || $v === 'null') {
                $whereParts[] = "{$key} IS NULL";
            } else if (is_string($v) && strpos($v, 'like:') === 0) {
                $ph = ":{$key}_lk";
                $whereParts[] = "{$key} LIKE {$ph}";
                $params[$ph] = "%" . substr($v, 5) . "%";
            } else {
                $whereParts[] = "{$key} = :{$key}";
                $params[":{$key}"] = $v;
            }
        }

        if ($search && $searchBy) {
            $whereParts[] = "{$searchBy} LIKE :search";
            $params[':search'] = "%{$search}%";
        }

        if ($whereParts) $sql .= " WHERE " . implode(" AND ", $whereParts);
        if ($groupBy) $sql .= " GROUP BY " . implode(',', (array)$groupBy);
        if ($orderBy && is_array($orderBy)) $sql .= " ORDER BY {$orderBy[0]} " . (strtoupper($orderBy[1] ?? 'ASC'));

        // Count Total
        $countSql = "SELECT COUNT(*) FROM ({$sql}) x";
        $stmtCount = $this->db->prepare($countSql);
        $stmtCount->execute($params);
        $total = (int)$stmtCount->fetchColumn();

        // Pagination
        $sql .= " LIMIT " . ($page * $size) . ", {$size}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return [
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $total
        ];
    }

    public function insert(string $table, array $data): string {
        $cols = array_keys($data);
        $clean = cleanColumns($cols);
        $placeholders = array_map(fn($k) => ":$k", $clean);
        $sql = "INSERT INTO `{$table}` (`".implode('`,`',$clean)."`) VALUES (".implode(',', $placeholders).")";
        $this->db->prepare($sql)->execute($data);
        return $this->db->lastInsertId();
    }

    public function update(string $table, array $data, array $where): int {
        $setParts = [];
        $params = [];
        foreach ($data as $k => $v) {
            $clean = clean($k);
            $setParts[] = "`{$clean}` = :s_{$clean}";
            $params[":s_{$clean}"] = $v;
        }
        $whereParts = [];
        foreach ($where as $k => $v) {
            $clean = clean($k);
            $whereParts[] = "`{$clean}` = :w_{$clean}";
            $params[":w_{$clean}"] = $v;
        }
        $sql = "UPDATE `{$table}` SET ".implode(',',$setParts)." WHERE ".implode(' AND ',$whereParts);
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    public function delete(string $table, array $where): int {
        $whereParts = [];
        $params = [];
        foreach ($where as $k => $v) {
            $clean = clean($k);
            $whereParts[] = "`{$clean}` = :{$clean}";
            $params[":{$clean}"] = $v;
        }
        $sql = "DELETE FROM `{$table}` WHERE ".implode(' AND ', $whereParts);
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }
}
