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
                        } elseif ($wv === 'is_not_null') {
                            $subWhereSql .= " AND ia.`{$wCol}` IS NOT NULL";
                        } elseif (is_string($wv) && strpos($wv, ',') !== false) {
                            $values = array_map('trim', explode(',', $wv));
                            $placeholders = [];
                            foreach ($values as $i => $val) {
                                $phIn = $phName . "_in_" . $i;
                                $placeholders[] = $phIn;
                                $params[$phIn] = $val;
                            }
                            $subWhereSql .= " AND ia.`{$wCol}` IN (" . implode(',', $placeholders) . ")";
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

            // 1. RAW QUERY
            if (strpos($rawKey, 'raw:') === 0 || strpos($rawKey, 'query:') === 0) {
                if (is_string($v)) {
                    $whereParts[] = "({$v})";
                }
                continue;
            }

            // 2. EXISTS / NOT EXISTS
            if (strpos($rawKey, 'exists:') === 0 || strpos($rawKey, 'not_exists:') === 0) {
                $isNotExists = strpos($rawKey, 'not_exists:') === 0;
                $subTable = clean(substr($rawKey, $isNotExists ? 11 : 7)); 
                
                if (is_array($v)) {
                    $subFk  = clean($v['foreign_key'] ?? '');
                    $subRef = clean($v['reference_key'] ?? 'id');
                    $subWhere = $v['where'] ?? [];
                    
                    if ($subTable && $subFk && $subRef) {
                        $subQueryConditions = [];
                        $subQueryConditions[] = "`$subTable`.`$subFk` = `$table`.`$subRef`";
                        
                        foreach ($subWhere as $sk => $sv) {
                            $sKey = clean($sk);
                            $sPh = ":ex_" . $subTable . "_" . str_replace(['.', '-'], '_', $sKey) . "_" . count($params);
                            
                            if ($sv === null || $sv === 'null') {
                                $subQueryConditions[] = "`$subTable`.`{$sKey}` IS NULL";
                            } elseif ($sv === 'is_not_null') {
                                $subQueryConditions[] = "`$subTable`.`{$sKey}` IS NOT NULL";
                            } elseif (is_string($sv) && strpos($sv, 'like:') === 0) {
                                $sSearchValue = substr($sv, 5); 
                                if (strpos($sSearchValue, ',') !== false) {
                                    $sLikeValues = array_map('trim', explode(',', $sSearchValue));
                                    $sOrParts = [];
                                    foreach ($sLikeValues as $sli => $slVal) {
                                        $sPhLike = $sPh . "_like_" . $sli;
                                        $sOrParts[] = "`$subTable`.`{$sKey}` LIKE {$sPhLike}";
                                        $params[$sPhLike] = "%{$slVal}%";
                                    }
                                    $subQueryConditions[] = "(" . implode(" OR ", $sOrParts) . ")";
                                } else {
                                    $subQueryConditions[] = "`$subTable`.`{$sKey}` LIKE {$sPh}";
                                    $params[$sPh] = "%{$sSearchValue}%";
                                }
                            } elseif (is_string($sv) && (substr($sv, 0, 2) === '!=')) {
                                $sRaw = ltrim($sv, '!=');
                                if (strpos($sRaw, ',') !== false) {
                                    $sNotValues = array_map('trim', explode(',', $sRaw));
                                    $sNotPlaceholders = [];
                                    foreach ($sNotValues as $ni => $nVal) {
                                        $sPhNot = $sPh . "_notin_" . $ni;
                                        $sNotPlaceholders[] = $sPhNot;
                                        $params[$sPhNot] = $nVal;
                                    }
                                    $subQueryConditions[] = "`$subTable`.`{$sKey}` NOT IN (" . implode(',', $sNotPlaceholders) . ")";
                                } else {
                                    $subQueryConditions[] = "`$subTable`.`{$sKey}` != {$sPh}";
                                    $params[$sPh] = $sRaw;
                                }
                            } elseif (is_string($sv) && strpos($sv, ',') !== false) {
                                $sValues = array_map('trim', explode(',', $sv));
                                $sPlaceholders = [];
                                foreach ($sValues as $si => $sVal) {
                                    $sPhIn = $sPh . "_in_" . $si;
                                    $sPlaceholders[] = $sPhIn;
                                    $params[$sPhIn] = $sVal;
                                }
                                $subQueryConditions[] = "`$subTable`.`{$sKey}` IN (" . implode(',', $sPlaceholders) . ")";
                            } else {
                                $subQueryConditions[] = "`$subTable`.`{$sKey}` = {$sPh}";
                                $params[$sPh] = $sv;
                            }
                        }
                        
                        $subQuerySql = implode(" AND ", $subQueryConditions);
                        $existsKeyword = $isNotExists ? "NOT EXISTS" : "EXISTS";
                        $whereParts[] = "$existsKeyword (SELECT 1 FROM `$subTable` WHERE $subQuerySql)";
                    }
                }
                continue; 
            }

            // 3. DATE FUNCTIONS
            if (strpos($rawKey, 'year:') === 0) {
                $colName = substr($rawKey, 5);
                $cleanCol = clean($colName);
                $ph = ":" . str_replace(['.', '-'], '_', $cleanCol) . "_yr";
                $whereParts[] = "YEAR({$cleanCol}) = {$ph}";
                $params[$ph] = (int)$v;
                continue;
            }
            if (strpos($rawKey, 'month:') === 0) {
                $colName = substr($rawKey, 6);
                $cleanCol = clean($colName);
                $ph = ":" . str_replace(['.', '-'], '_', $cleanCol) . "_mt";
                $whereParts[] = "MONTH({$cleanCol}) = {$ph}";
                $params[$ph] = (int)$v;
                continue;
            }

            // 4. LIKE
            if (is_string($v) && strpos($v, 'like:') === 0) {
                $cleanCol = clean($k);
                $searchValue = substr($v, 5);
                if (strpos($searchValue, ',') !== false) {
                    $values = array_map('trim', explode(',', $searchValue));
                    $orParts = [];
                    foreach ($values as $i => $val) {
                        $ph = ":" . $cleanCol . "_like_" . $i;
                        $orParts[] = "{$cleanCol} LIKE {$ph}";
                        $params[$ph] = "%{$val}%";
                    }
                    $whereParts[] = "(" . implode(" OR ", $orParts) . ")";
                } else {
                    $ph = ":" . $cleanCol . "_like";
                    $whereParts[] = "{$cleanCol} LIKE {$ph}";
                    $params[$ph] = "%{$searchValue}%";
                }
                continue;
            }
            
            $key = clean($rawKey);
            if ($v === null || $v === 'null') {
                $whereParts[] = "{$key} IS NULL";
            } elseif ($v === 'is_not_null' || $v === '!=null') {
                $whereParts[] = "{$key} IS NOT NULL";
            } elseif (is_string($v) && (substr($v, 0, 2) === '!=' || substr($v, 0, 3) === '!==')) {
                $raw = ltrim($v, '!=');
                if (strpos($raw, ',') !== false) {
                    $values = array_map('trim', explode(',', $raw));
                    $placeholders = [];
                    foreach ($values as $i => $val) {
                        $ph = ":{$key}notin{$i}";
                        $placeholders[] = $ph;
                        $params[$ph] = $val;
                    }
                    $whereParts[] = "{$key} NOT IN (" . implode(',', $placeholders) . ")";
                } else {
                    $ph = ":{$key}_neq";
                    $whereParts[] = "{$key} != {$ph}";
                    $params[$ph] = $raw;
                }
            } elseif (is_string($v) && strpos($v, ',') !== false) {
                $values = array_map('trim', explode(',', $v));
                $placeholders = [];
                foreach ($values as $i => $val) {
                    $ph = ":{$key}_{$i}";
                    $placeholders[] = $ph;
                    $params[$ph] = $val;
                }
                $whereParts[] = "{$key} IN (" . implode(',', $placeholders) . ")";
            } else {
                $operator = '=';
                $val = $v;
                if (is_string($v)) {
                    if (strpos($v, '>=') === 0) { $operator = '>='; $val = substr($v, 2); }
                    elseif (strpos($v, '<=') === 0) { $operator = '<='; $val = substr($v, 2); }
                    elseif (strpos($v, '>') === 0) { $operator = '>'; $val = substr($v, 1); }
                    elseif (strpos($v, '<') === 0) { $operator = '<'; $val = substr($v, 1); }
                }
                $whereParts[] = "{$key} {$operator} :{$key}";
                $params[":{$key}"] = $val;
            }
        }

        if ($search) {
            $searchValues = "%{$search}%";
            $params[':search'] = $searchValues;
            if (strpos($searchBy, ',') !== false) {
                $searchCols = explode(',', $searchBy);
                $orParts = [];
                foreach ($searchCols as $col) {
                    $col = trim($col);
                    if (preg_match('/^[a-zA-Z0-9_\.]+$/', $col)) {
                        $orParts[] = "{$col} LIKE :search";
                    }
                }
                if (!empty($orParts)) $whereParts[] = "(" . implode(" OR ", $orParts) . ")";
            } else {
                if (preg_match('/^[a-zA-Z0-9_\.]+$/', $searchBy)) {
                    $whereParts[] = "{$searchBy} LIKE :search";
                }
            }
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

    public function bulkInsert(string $table, array $rows, bool $updateOnDuplicate = false, bool $withId = false): array {
        $sql = "";
        try {
            if (empty($rows)) return ['status' => 'ok', 'affected_total' => 0];

            $allKeys = [];
            foreach ($rows as $r) {
                $allKeys = array_unique(array_merge($allKeys, array_keys($r)));
            }

            if (!$withId) {
                $allKeys = array_filter($allKeys, fn($k) => strtolower($k) !== 'id');
            }

            $cleanKeys = cleanColumns(array_values($allKeys));
            $valueSets = [];
            $params = [];

            foreach ($rows as $i => $row) {
                $placeholders = [];
                foreach ($cleanKeys as $key) {
                    $ph = ":{$key}_{$i}";
                    $placeholders[] = $ph;
                    $params[$ph] = $row[$key] ?? null;
                }
                $valueSets[] = '(' . implode(',', $placeholders) . ')';
            }

            $sql = "INSERT INTO `{$table}` (`" . implode('`,`', $cleanKeys) . "`) VALUES " . implode(',', $valueSets);

            if ($updateOnDuplicate) {
                $updateParts = [];
                foreach ($cleanKeys as $key) {
                    if (strtolower($key) !== 'id') {
                        $updateParts[] = "`{$key}` = VALUES(`{$key}`)";
                    }
                }
                if (!empty($updateParts)) {
                    $sql .= " ON DUPLICATE KEY UPDATE " . implode(',', $updateParts);
                } else {
                    $sql .= " ON DUPLICATE KEY UPDATE `id` = `id` ";
                }
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return [
                'status' => 'ok',
                'affected_total' => count($rows)
            ];

        } catch (PDOException $e) {
            sendTelegram("BulkInsert Fatal Error:\n" . $e->getMessage() . "\nTable: " . $table . "\nSQL: " . substr($sql, 0, 500));
            throw $e;
        }
    }
}
