/* @flow */

import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import styles from "./Table.css";
import { t } from "c-3po";
import ExplicitSize from "metabase/components/ExplicitSize.jsx";
import Ellipsified from "metabase/components/Ellipsified.jsx";
import Icon from "metabase/components/Icon.jsx";

import { formatColumn, formatValue } from "metabase/lib/formatting";
import {
  getTableCellClickedObject,
  isColumnRightAligned,
} from "metabase/visualizations/lib/table";

import cx from "classnames";
import _ from "underscore";

import type { VisualizationProps } from "metabase/meta/types/Visualization";
import { GroupingManager } from "metabase/visualizations/lib/GroupingManager";

type Props = VisualizationProps & {
  height: number,
  className?: string,
  isPivoted: boolean,
  groupingManager: GroupingManager,
};

type State = {
  page: number,
  pageSize: number,
  sortColumn: ?number,
  sortDescending: boolean,
};

@ExplicitSize
export default class TableSimpleSummary extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      page: 0,
      pageSize: 1,
      sortColumn: null,
      sortDescending: false,
    };
  }

  static propTypes = {
    data: PropTypes.object.isRequired,
  };

  static defaultProps = {
    className: "",
  };

  setSort(colIndex: number) {
    if (this.state.sortColumn === colIndex) {
      this.setState({ sortDescending: !this.state.sortDescending });
    } else {
      this.setState({ sortColumn: colIndex });
    }
  }

  componentDidUpdate() {
    let headerHeight = ReactDOM.findDOMNode(
      this.refs.header,
    ).getBoundingClientRect().height;
    let footerHeight = this.refs.footer
      ? (ReactDOM.findDOMNode(this.refs.footer || this.refs.header) || headerHeight).getBoundingClientRect().height
      : 0;
    let rowHeight =
      (ReactDOM.findDOMNode(this.refs.firstRow || this.refs.header) || headerHeight).getBoundingClientRect().height +
      1;
    let pageSize = Math.max(
      1,
      Math.floor((this.props.height - headerHeight - footerHeight) / rowHeight),
    );
    if (this.state.pageSize !== pageSize) {
      this.setState({ pageSize });
    }
  }

  render() {
    const {
      data,
      onVisualizationClick,
      visualizationIsClickable,
      isPivoted,
    } = this.props;
    const { rows, cols } = data;

    const groupingManager = data;

    const { page, pageSize, sortColumn, sortDescending } = this.state;

    let start = pageSize * page;
    let end = Math.min(rows.length - 1, pageSize * (page + 1) - 1);

    let rowIndexes = _.range(0, rows.length);
    if (sortColumn != null) {
      rowIndexes = _.sortBy(rowIndexes, rowIndex => rows[rowIndex][sortColumn]);
      if (sortDescending) {
        rowIndexes.reverse();
      }
    }

    return (
      <div className={cx(this.props.className, "relative flex flex-column")}>
        <div className="flex-full relative">
          <div
            className="absolute top bottom left right scroll-x scroll-show scroll-show--hover"
            style={{ overflowY: "hidden" }}
          >
            <table
              className={cx(
                styles.Table,
                styles.TableSimple,
                "fullscreen-normal-text",
                "fullscreen-night-text",
              )}
            >
              <thead ref="header">
              <tr >
                {cols.map((col, colIndex) => {
                  if (col.parentName) {
                    return (
                    <th
                      key={'1'-colIndex}
                      className={cx(
                        "TableInteractive-headerCellData cellData text-brand-hover",
                        {
                          "TableInteractive-headerCellData--sorted":
                          sortColumn === colIndex,
                          "text-right": isColumnRightAligned(col.parentName[2]),
                        },
                      )}
                      colSpan={col.parentName[1]}
                    >
                      <div className="relative">
                        <Icon
                          name={sortDescending ? "chevrondown" : "chevronup"}
                          width={8}
                          height={8}
                          style={{
                            position: "absolute",
                            right: "100%",
                            marginRight: 3,
                          }}
                        />
                        <Ellipsified>{formatValue(col.parentName[0], {
                          column: col.parentName[2],
                          jsx: true,
                          rich: true,
                        })}
                        </Ellipsified>
                      </div>
                    </th>)
                  }
                })}
              </tr>
                <tr>
                  {cols.map((col, colIndex) => (
                    <th
                      key={'2'-colIndex}
                      className={cx(
                        "TableInteractive-headerCellData cellData text-brand-hover",
                        {
                          "TableInteractive-headerCellData--sorted":
                            sortColumn === colIndex,
                          "text-right": isColumnRightAligned(col),
                        },
                      )}
                      onClick={() => this.setSort(colIndex)}
                    >
                      <div className="relative">
                        <Icon
                          name={sortDescending ? "chevrondown" : "chevronup"}
                          width={8}
                          height={8}
                          style={{
                            position: "absolute",
                            right: "100%",
                            marginRight: 3,
                          }}
                        />
                        <Ellipsified>{col && formatColumn(col)}</Ellipsified>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowIndexes.slice(start, end + 1).map((rowIndex, index) => (
                  <tr key={rowIndex} ref={index === 0 ? "firstRow" : null}>
                    {cols.map((_, columnIndex) => {
                      if (groupingManager.isVisible(rowIndex, columnIndex, {start, stop:end})
                      ) {
                        const column = cols[columnIndex];
                        const row = rows[rowIndex];
                        let cell = column.getValue(row);
                        const clicked = getTableCellClickedObject(
                          data,
                          rowIndex,
                          columnIndex,
                          isPivoted,
                        );
                        const isClickable =
                          onVisualizationClick &&
                          visualizationIsClickable(clicked);
                        const rowSpan = groupingManager.getRowSpan(rowIndex, columnIndex, {start, stop:end});
                        const isGrandTotal = row.isTotalColumnIndex === 0;
                        if (isGrandTotal && columnIndex === 0)
                          cell = 'Grand totals';

                        let mappedStyle = {... groupingManager.mapStyle(rowIndex, columnIndex, {start, stop:end}, {})};
                        if(isGrandTotal)
                          mappedStyle = {... mappedStyle, background: '#509ee3', color: 'white', 'font-weight':'bold'};
                        else if (row.isTotalColumnIndex && row.isTotalColumnIndex <= columnIndex +1)
                          mappedStyle = {... mappedStyle, background: '#EDEFF0', color: '#6E757C', 'font-weight':'bold' };


                        let formatedRes = formatValue(cell, {
                          column: column,
                          jsx: true,
                          rich: true,
                        });

                        if(row.isTotalColumnIndex === columnIndex + 1 && typeof formatedRes === 'string')
                          formatedRes = 'Totals for ' + formatedRes;


                        const res = (
                          <td
                            key={rowIndex + '-' + columnIndex}
                            style={{...mappedStyle, whiteSpace: "nowrap", verticalAlign :'top' }}
                            className={cx("px1 border-bottom", {
                              "text-right": isColumnRightAligned(
                                cols[columnIndex],
                              ),
                            })}
                            rowSpan={rowSpan}
                          >
                            <span
                              className={cx({
                                "cursor-pointer text-brand-hover": isClickable,
                              })}
                              onClick={
                                isClickable
                                  ? e => {
                                      onVisualizationClick({
                                        ...clicked,
                                        element: e.currentTarget,
                                      });
                                    }
                                  : undefined
                              }
                            >
                              {formatedRes}
                            </span>
                          </td>
                        );
                        return res;
                      } else return <td style={{ display: "none" }} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {pageSize < rows.length ? (
          <div
            ref="footer"
            className="p1 flex flex-no-shrink flex-align-right fullscreen-normal-text fullscreen-night-text"
          >
            <span className="text-bold">{t`Rows ${start + 1}-${end + 1} of ${
              rows.length
            }`}</span>
            <span
              className={cx("text-brand-hover px1 cursor-pointer", {
                disabled: start === 0,
              })}
              onClick={() => this.setState({ page: page - 1 })}
            >
              <Icon name="left" size={10} />
            </span>
            <span
              className={cx("text-brand-hover pr1 cursor-pointer", {
                disabled: end + 1 >= rows.length,
              })}
              onClick={() => this.setState({ page: page + 1 })}
            >
              <Icon name="right" size={10} />
            </span>
          </div>
        ) : null}
      </div>
    );
  }
}
